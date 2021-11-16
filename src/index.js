module.exports = (Plugin, Library) => {
    const { DiscordClasses, DiscordModules, DiscordSelectors, Logger, Patcher, ReactTools, Utilities, WebpackModules } = Library;

    const { GuildStore, React } = DiscordModules;

    const Lists = WebpackModules.getByProps('ListThin');
    const Guilds = WebpackModules.getByProps('wrapper', 'unreadMentionsIndicatorTop');

    const rootClass = DiscordClasses.PopoutRoles.root.value,
        roleClass = DiscordClasses.PopoutRoles.role.value + " bodyInnerWrapper-26fQXj interactive roleFilter",
        roleCircleClass = DiscordClasses.PopoutRoles.roleCircle.value + " roleFilter",
        roleNameClass = DiscordClasses.PopoutRoles.roleName.value + " roleFilter";

    const Role = class Role {
        constructor(id, name, color) {
            this.id = id;
            this.name = name;
            this.color = color;
        }
    }

    const Channel = class Channel {
        constructor(id, rows) {
            this.id = id;
            this.rows = rows;
        }
    }

    const RolePill = class RolePill extends React.Component {
        constructor(props) {
            super(props);
            this.onClick = this.onClick.bind(this);
        }
        
        onClick() {
            this.props.onClick(this.props.role.id);
        }

        render() {
            return React.createElement('div', {
                className: roleClass,
                style: {overflow: "auto"},
                onClick: this.onClick
            },
                React.createElement('div', {
                    className: roleCircleClass,
                    style: {
                        backgroundColor: this.props.role.color,
                        // ensure circle has proper width on long role names
                        display: "inline-table"
                    }
                }),
                React.createElement('div', {className: roleNameClass},
                    this.props.role.name
                )
            )
        }
    }

    return class RoleFilter extends Plugin {
        constructor() {
            super();

            this.handleRolePillClick = this.handleRolePillClick.bind(this);
            this.handleRoleFilterClick = this.handleRoleFilterClick.bind(this);

            this.useAnd = true;
        }
        
        onStart() {
            this.patchRoles();
            this.patchGuilds();
            this.patchMemberList();

            document.addEventListener("click", this.handleRolePillClick, true);
        }

        onStop() {
            const roleModule = WebpackModules.getByProps("role")
            
            if(roleModule.role.includes(" interactive")) {
                roleModule.role = roleModule.role.replace(" interactive","");
            }

            document.removeEventListener.bind(document, "click", this.handleRolePillClick, true);
            
            Patcher.unpatchAll();

            this.updateMemberList();
        }

        /**
         * Turns off the filter and re-renders the member list
         */
        resetFilter() {
            this.guildId = "";
            this.filter = null;
            this.updateMemberList();
        }

        /**
         * Removes the id from the filter, if it exists.
         * @param {string} roleId ID of the role to remove
         */
        removeRoleFromFilter(roleId) {
            if (!this.filter) return;
            this.filter.roles = this.filter.roles.filter(role => role.id != roleId);
            this.filterByRoles(this.filter.roles);
            this.updateMemberList();
        }

        /**
         * Make roles interactive, and set the guild id when viewing user's roles
         */
        patchRoles() {
            const roleModule = WebpackModules.getByProps("role")

            if(!roleModule.role.includes("interactive")) {
                roleModule.role += " interactive"
            }
            
            const RoleObj = WebpackModules.getModule(m => m && m.default.displayName === 'UserPopoutBody');
            Patcher.after(RoleObj, "default",  (_, [props], component) => {
                if (!component || !component.props || !component.props.className) return;

                this.guildId = props.guild.id;
            });
        }

        /**
         * Watches for changes in the guild ID. 
         * @todo Rework this to find guild more cleanly
         */
        async patchGuilds() {
            const GuildsList = await new Promise((resolve) => {
                const guildsWrapper = document.querySelector(`.${Guilds.wrapper.replace(/\s/, '.')}`);
                if (!guildsWrapper) return resolve(null);
                const instance = ReactTools.getReactInstance(guildsWrapper);
                const forwarded = Utilities.findInTree(instance, (tree) => {
                    if (!tree) return false;
                    const forward = String(tree['$$typeof']).includes('react.forward_ref');
                    const string = tree.render && tree.render.toString().includes('ltr');
                    return forward && string;
                }, {
                    walkable: [
                        'type',
                        'child',
                        'sibling'
                    ]
                });
                if (instance && forwarded) resolve(forwarded);
                else resolve(null);
            });

            if (!GuildsList) return;
            
            Patcher.after(GuildsList, 'render', (that, props, value) => {
                if (this.guildId != BdApi.findModuleByProps('getLastSelectedGuildId').getLastSelectedGuildId()) {
                    Logger.info("Server change detected.");
                    this.handleRoleFilterClick();
                }

                return value;
            });
        }

        /**
         * Renders the role pill when filtering. Watches for channel changes.
         */
        patchMemberList() {
            Patcher.after(Lists.ListThin, 'render', (that, args, value) => {
                const [props] = args;
                
                if (!props || !props['data-list-id'] 
                    || !props['data-list-id'].startsWith('members')
                    // make sure the list is actually rendered before proceeding
                    || !value.ref || !value.ref.current) return value;

                const memberListContainer = ReactTools.getOwnerInstance(value.ref.current.parentElement)

                this.patchMemberListContainer(value);

                if (!this.channel || this.channel.id != memberListContainer.props.channel.id) {
                    Logger.info("Channel change detected.");
                    // if a channel object isn't created, or if the channel has changed, create new channel
                    this.channel = new Channel(
                        memberListContainer.props.channel.id,
                        memberListContainer.props.rows
                    );

                    // if a filter has been applied, refresh the filter for new channel
                    if (this.filter) {
                        this.filterByRoles(this.filter.roles);
                    }
                }

                // always insert the element, even when not filtering
                // so that user popout does not close when clicking filter
                if (value) this.insertRoleElem(value);                

                return value;
            });
        }

        /**
         * Alters the render functions in the member list container to follow filter behavior.
         * @param {React element} memberListElem the member list element
         */
        patchMemberListContainer(memberListElem) {
            const memberList = ReactTools.getOwnerInstance(memberListElem.ref.current.parentElement);
            
            Patcher.after(memberList, "renderRow", (that, args, value) => {
                if (!this.filter || !this.filter.membersAllowed || !value || !value.props) return value;
                if (!this.filter.membersAllowed.includes(value.props.user.id)) return null;
            });
            Patcher.after(memberList, "renderSection", (that, args, value) => {
                if (!this.filter || !this.filter.sectionsAllowed || !value || !value.props) return value;
                
                // first section will have children, rest wont
                const props = !value.props.children ? value.props : value.props.children.props;

                if (this.filter.sectionsAllowed[props.id]) 
                    // count for each section needs to be manually updated
                    props.count = this.filter.sectionsAllowed[props.id].count;
                else return null;
            });
        }

        /**
         * Forces an update on the member list and it's parent element
         */
        updateMemberList() {
            const memberList = document.querySelector(DiscordSelectors.MemberList.members.value.trim());
            if (!memberList) return;
            this.forceUpdate(memberList.parentElement);
            this.forceUpdate(memberList);
        }

        /**
         * Gets react instance of an HTML element and forces an update.
         * @param {HTML element} elem 
         */
        forceUpdate(elem) {
            const owner = ReactTools.getOwnerInstance(elem);
            owner.forceUpdate();
            if (owner.handleScroll) owner.handleScroll();
        }

        /**
         * Take a list of role IDs and return information on how to filter by those IDs.
         * @param {Role[]} roles List of IDs to include in the filter
         * @param {boolean} useAnd True to use AND logic, false to use OR
         * @returns {
         *     maxIdx: number,
         *     groupList: {groupId: count of group},
         *     membersList: string[] ,
         *     sectionsFound: number,
         *     membersFound: number 
         * }
         */
        getAllowedMembers(roles, useAnd) {
            let maxIdx = -1, count = 0, 
                // keeping track of sections and members allows us to resize div
                // and make sure that all users in the filter are rendered
                // without creating performance problems
                sectionsFound = 0, sectionsCount = 0,
                membersFound = 0,  membersCount = 0,
                currentId;
            const groupList = {};
            const membersList = this.channel.rows.filter((member, idx) => {
                // get rid of members not in role ID list
                if (member.type != "MEMBER"){
                    sectionsCount++;
                    return true;
                } 
                else membersCount++;

                let memberAllowed;
                if (useAnd) // AND 
                    memberAllowed = roles.every(role => member.roles.includes(role.id));
                else // OR
                    memberAllowed = member.roles.some(roleId => roles.some(role => role.id === roleId));

                // keep track of highest index we've reached
                if (memberAllowed) {
                    // only update "found" if a member is allowed, to make sure we don't overcount
                    sectionsFound += sectionsCount;
                    sectionsCount = 0;
                    membersFound += membersCount;
                    membersCount = 0;
                    maxIdx = idx;
                }

                return memberAllowed;
            }).filter((group, idx, arr) => {
                // construct list of groups that have members in them
                if (group.type != "GROUP") {
                    count = count + 1;

                    // last group ends in a member and won't be counted without the following lnie
                    if (!arr[idx + 1] && count > 0) groupList[currentId] = {count};

                    return true;
                }

                if (group.id != currentId) {
                    // found new group or are at end of list, add it to the list if there are members in it
                    if (count > 0) groupList[currentId] = {count};

                    currentId = group.id;
                    count = 0;
                }
                
                // filter out groups regardless
                return false;
            }).map(member => member.user.id); // return id, not member object

            return {
                maxIdx,
                groupList,
                membersList,
                sectionsFound,
                membersFound
            }
        }

        /**
         * Gets all roles in the current guild whose name matches the passed in parameter.
         * @param {string} roleName 
         * @returns {Role[]} List of roles that match the passed name
         */
        getRolesByName(roleName) {
            const guildRoles = GuildStore.getGuild(this.guildId).roles;

            const roles = [];

            // roles is not an array >:( so we have to iterate through keys
            for (const roleId in guildRoles) {
                const guildRole = guildRoles[roleId];
                if(guildRole.name && roleName === guildRole.name) {
                    roles.push(new Role(
                        guildRole.id,
                        guildRole.name,
                        guildRole.colorString
                    ));
                }
            }

            return roles;
        }
        
        /**
         * Filter channel member list on list of roles.
         * @param {Role[]} roles Array of roles to filter by
         */
        filterByRoles(roles) {
            this.setFilter(
                roles,
                this.getAllowedMembers(roles, this.useAnd)
            );
        }

        /**
         * Sets the filter object. Does not refresh list or apply the filter.
         * @param {Role[]} roles Array of roles included in the filter
         * @param {*} channelMembers Object which contains information on the filter
         */
        setFilter(roles, channelMembers) {
            this.filter = {
                roles,
                membersAllowed: channelMembers.membersList,
                sectionsAllowed: channelMembers.groupList
            }
        }

        /**
         * Creates a Role pill and prepends it to children of passed in element.
         * @param {React.element} membersListElem React element to add role to
         */
        insertRoleElem(membersListElem) {            
            if (!Array.isArray(membersListElem.props.children))
                membersListElem.props.children = [membersListElem.props.children];

            const roleStyle = this.filter && this.filter.roles.length > 0 ? {
                padding: "24px 8px 0px 16px"
            } : {
                display: "none"
            }

            const roleContainer = React.createElement('div', {
                className: rootClass,
                style: roleStyle,
                children: this.filter && this.filter.roles.map(role =>
                    React.createElement(RolePill, {
                        role,
                        onClick: this.handleRoleFilterClick
                    })
                )
            });

            membersListElem.props.children.unshift(roleContainer);
        }

        /**
         * Handles all click events. 
         * Filters out event if target's classes don't match role classes.
         * @param {HTML Element} target The element to handle the click event on
         */
        handleRolePillClick({ target }) {
            let roleName = "";

            if(!this.guildId || target.classList.contains("roleFilter")) {
                return;
            } 
            else if (target.classList.contains("role-2irmRk")) {
                roleName = target.children[1].innerText;
            }
            else if (target.classList.contains("roleName-32vpEy")) {
                roleName = target.innerText;
            }
            else if (target.classList.contains("roleCircle-3xAZ1j")) {
                roleName = target.nextSibling.innerText;
            }
            else {
                return;
            }

            const newRoles = this.getRolesByName(roleName);            

            if (this.filter) {
                this.filter.roles = this.filter.roles.concat(
                    // Don't add the role to the filter if it's already in there
                    newRoles.filter(newRole => !this.filter.roles.some(role => role.id === newRole.id))
                );
                this.filterByRoles(this.filter.roles);
            }
            else
                this.filterByRoles(newRoles);
                
            
            Logger.info(`Clicked on role: "${roleName}". Members found:`, this.filter.membersAllowed);

            this.updateMemberList();
        }
        
        /**
         * Removes the specified role from the filter. Removes the filter if all filters are gone.
         * @param {string} roleId The ID of the role that was clicked on
         */
        handleRoleFilterClick(roleId) {
            if (!this.filter) return;
            this.removeRoleFromFilter(roleId);
            if (this.filter.roles.length === 0) this.resetFilter();
            this.updateMemberList();
        }
    };
};