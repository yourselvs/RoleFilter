module.exports = (Plugin, Library) => {
    const { DiscordClassModules, DiscordModules, DiscordSelectors, Patcher, PluginUtilities, Popouts, ReactTools, Settings, Toasts, Tooltip, WebpackModules } = Library;

    const { GuildStore, ChannelStore, SelectedChannelStore, React } = DiscordModules;

    const plusPath = require("plusPath.txt");
    const searchPath = require("searchPath.txt");
    const roleFilterCss = require("roleFilter.css");

    const Lists = WebpackModules.getByProps("ListThin");

    const classes = {
        roleRoot: DiscordClassModules.PopoutRoles.root,
        role: `${DiscordClassModules.PopoutRoles.role} ${WebpackModules.getByProps("bodyInnerWrapper").bodyInnerWrapper} interactive roleFilter roleFilter-role`,
        roleCircle: DiscordClassModules.PopoutRoles.roleCircle + " roleFilter",
        roleName: DiscordClassModules.PopoutRoles.roleName + " roleFilter",
        layer: DiscordClassModules.TooltipLayers.layer,
        header: "roleFilter-header",
        popoutContainer: "roleFilter-popoutContainer",
        listContainer: "roleFilter-listContainer",
        listOption: "roleFilter-listOption",
        emptyList: "roleFilter-emptyList",
        searchContainer: "roleFilter-searchContainer",
        searchInput: "roleFilter-searchInput",
        btnContainer: `${DiscordClassModules.PopoutRoles.addButton} roleFilter-btnContainer`,
        btnPadding: "roleFilter-btnPadding",
        addBtn: `${DiscordClassModules.PopoutRoles.addButtonIcon} roleFilter-addBtn`,
        addBtnPath: "roleFilter-addBtnPath",
        searchIcon: "roleFilter-searchIcon",
        searchPath: "roleFilter-searchPath"
    }

    const memberHeight = 44,
        sectionHeight = 40;

    /**
     * @param {string} id The discord id of the role
     * @param {string} name The name assigned to the role
     * @param {string} color The color assigned to the role
     */
    const Role = class Role {
        constructor(id, name, color) {
            this.id = id;
            this.name = name;
            this.color = color;
        }
    }

    /**
     * @param {string} id The discord id of the channel
     * @param {Member[]} rows Array of Member objects used by discord to construct member list.
     *      (not user defined)
     */
    const Channel = class Channel {
        constructor(id, rows) {
            this.id = id;
            this.rows = rows;
        }
    }

    /**
     * @param {Role[]} roles List of roles in the filter
     * @param {string[]} membersAllowed List of user ids allowed by the filter
     * @param {string[]} sectionsAllowed List of section ids allowed by the filter
     * @param {number} membersFound Number of total members found when searching through filter
     *      Includes members not in the filter
     *      Used for calculating member list container height
     * @param {number} sectionsFound Number of total sections found when searching through filter
     *      Includes sections not in the filter
     *      Used for calculating member list container height
     */
    const Filter = class Filter {
        constructor(roles, membersAllowed, sectionsAllowed, membersFound, sectionsFound) {
            this.roles = roles;
            this.membersAllowed = membersAllowed;
            this.sectionsAllowed = sectionsAllowed;
            this.membersFound = membersFound;
            this.sectionsFound = sectionsFound;
        }
    }

    /**
     * @property {(e) => void} onClick Called when role pill is clicked
     * @property {Role} role Role object to construct role pill from
     */
    const RolePill = class RolePill extends React.Component {

        constructor(props) {
            super(props);
        }
        
        handleClick() {
            this.props.onClick(this.props.role.id);
        }

        render() {
            return React.createElement("div", {
                className: classes.role,
                style: {overflow: "auto"},
                onClick: () => this.handleClick()
            },
                React.createElement("div", {
                    className: classes.roleCircle,
                    style: {
                        backgroundColor: this.props.role.color,
                        // ensure circle has proper width on long role names
                        display: "inline-table"
                    }
                }),
                React.createElement("div", {className: classes.roleName},
                    this.props.role.name
                )
            )
        }
    }

    /**
     * @property {(e) => void} onClick Called when a role pill in the list is clicked
     * @property {Filter} filter The plugin's current filter state
     */
    const RoleFilterList = class RoleFilterList extends React.Component {
        render() {
            const roleFiltersListChildren = this.getRoleFilterListChildren(this.props.filter);

            // if there are no children, return null rather than undefined
            return roleFiltersListChildren ? React.createElement("div", {
                style: { display: "contents" },
                children: roleFiltersListChildren
            }) : null;
        }

        getRoleFilterListChildren(filter) {
            return filter && filter.roles.map(role =>
                React.createElement(RolePill, {
                    role,
                    onClick: this.props.onClick
                })
            );
        }
    }

    /**
     * @property {(e) => void} onClick Called when the add button is clicked
     */
    const AddRoleButton = class AddRoleButton extends React.Component {
        constructor(props) {
            super(props);
        }

        render() {
            return React.createElement("div", {
                className: classes.btnContainer,
                onClick: (e) => this.props.onClick(e),
                onContextMenu: (e) => this.props.onClick(e)
            }, 
                React.createElement("svg", {
                    className: classes.addBtn,
                    ariaHidden: true,
                    width: "24",
                    height: "24",
                    viewBox: "0 0 24 24"
                },
                    React.createElement("path", {
                        className: classes.addBtnPath,
                        d: plusPath
                    })
                )
            );
        }
    }

    /**
     * @property {() => void} onAddButtonClick Called when the "add role" button is clicked
     * @property {() => void} onRoleClick Called when a role pill in the filter list is clicked
     * @property {Filter} filter The plugin's current filter state
     * @property {boolean} showAddRoleButton
     */
    const RoleHeader = class RoleHeader extends React.Component {
        render() {
            const containerClass = `${classes.roleRoot} ${classes.header}`;

            return React.createElement("div", {
                className: containerClass
            },
                this.props.showAddRoleButton ? React.createElement(AddRoleButton, {
                    onClick: this.props.onAddButtonClick
                }) : null,
                React.createElement(RoleFilterList, {
                    filter: this.props.filter,
                    onClick: this.props.onRoleClick,
                })
            );
        }        
    }

    /**
     * @property {() => void} onRoleSelect Called when a role in the popout list is selected
     * @property {() => void} onRoleDeselect Called when a role in the popout list is deselected
     * @property {Role[]} guildRoles List of roles in the currently selected guild
     * @property {Role[]} selectedRoles List of roles applied by the filter
     */
    const RolePopout = class RolePopout extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                searchValue: null
            };
        }

        render() {
            return React.createElement("div", {
                className: `${classes.layer} ${classes.popoutContainer}`
            },
                React.createElement(RoleSearch, {
                    onChange: (e) => this.onSearch(e)
                }),
                React.createElement(RoleList, {
                    onRoleSelect: this.props.onRoleSelect,
                    onRoleDeselect: this.props.onRoleDeselect,
                    guildRoles: this.props.guildRoles,
                    selectedRoles: this.props.selectedRoles,
                    searchValue: this.state.searchValue
                })
            );
        }

        onSearch(event) {
            this.setState({
                searchValue: event.target.value
            });
        }
    }

    /**
     * @property {(string) => void} onChange Called when the input value is changed
     */
    const RoleSearch = class RoleSearch extends React.Component {
        render() {
            return React.createElement("div", {
                className: classes.searchContainer
            },
                React.createElement("input", {
                    className: classes.searchInput,
                    placeholder: "Search Roles",
                    onChange: this.props.onChange,
                    autoFocus: true,
                    onFocus: e => e.target.select()
                }),
                React.createElement("svg", {
                    className: classes.searchIcon,
                    onClick: this.onClick
                },
                    React.createElement("path", {
                        className: classes.searchPath,
                        d: searchPath
                    })
                )
            );
        }
    }

    /**
     * @property {(Role) => void} onRoleSelect Called when a role in the popout list is selected
     * @property {(Role) => void} onRoleDeselect Called when a role in the popout list is deselected
     * @property {Role[]} guildRoles List of roles in the currently selected guild
     * @property {Role[]} selectedRoles List of roles applied by the filter
     * @property {string} searchValue Value that the role names must include to show up in the list
     */
    const RoleList = class RoleList extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                selectedRoles: this.props.selectedRoles
            }
        }

        render() {
            let listChildren = this.getRoleList();
            
            if (listChildren.length === 0) {
                listChildren = this.getEmptyListDisplay();
            }

            return React.createElement("div", {
                className: classes.listContainer,
                children: listChildren
            });
        }

        /**
         * Maps the guild's roles to RoleListOption components.
         * Filters roles to include the searchValue prop in the role's name.
         * Highlights roles that are selected
         * @returns {RoleListOption[]}
         */
        getRoleList() {
            return this.props.guildRoles.map(role => {
                const passesSearch = this.searchRole(role);

                if(!passesSearch)
                    return null;

                const selected = this.state.selectedRoles && 
                    this.state.selectedRoles.some(selectedRole => 
                        selectedRole.id == role.id
                    );

                return React.createElement(RoleListOption, {
                    onClick: (r, s) => this.handleRoleClick(r, s),
                    role,
                    selected
                })
            }).filter(n => n);
        }

        /**
         * Selects or deselects a role that was clicked.
         * @param {Role} role Role object to add to state and filter
         * @param {boolean} selected True if the role is currently selected. False otherwise
         */
        handleRoleClick(role, selected) {
            if (selected)
                this.deselectRole(role);
            else
                this.selectRole(role);
        }

        /**
         * Adds role to the selectedRoles state.
         * Fires callback to add role to plugin state.
         * @param {Role} role Role object to add to state and filter
         */
        selectRole(role) {
            let roles = this.state.selectedRoles;

            if(!roles)
                roles = [];

            roles.push(role);

            this.setState({
                selectedRoles: roles
            });

            this.props.onRoleSelect(role);
        }

        /**
         * Removes role from the selectedRoles state.
         * Fires callback to remove role from plugin state.
         * @param {Role} role Role object to remove from state and filter
         */
        deselectRole(role) {
            let roles = this.state.selectedRoles.filter(selectedRole => {
                return role.id !== selectedRole.id;
            })

            this.setState({
                selectedRoles: roles
            })

            this.props.onRoleDeselect(role);
        }

        /**
         * Checks if a role's name passes the search filter, case-insensitive
         * @param {Role} role Role to validate
         * @returns {boolean} True if role name includes search value, false otherwise
         */
        searchRole(role) {
            if(!this.props.searchValue)
                return true;

            return role.name.toLowerCase().includes(this.props.searchValue.toLowerCase());
        }

        getEmptyListDisplay() {
            return React.createElement('div', {
                className: classes.emptyList
            }, "No roles found.")
        }
    }

    /**
     * @property {(Role, boolean) => void} onClick Called when the option is clicked on
     * @property {Role} role The role to construct the list option from
     * @property {boolean} selected Whether or not the list option is selected in the filter
     */
    const RoleListOption = class RoleListOption extends React.Component {
        constructor(props) {
            super(props);
        }

        render() {
            return React.createElement("div", {
                className: `${classes.listOption} ${this.props.selected ? 'selected': 'interactive'}`,
                style: {
                    color: this.props.role.color
                },
                onClick: () => this.handleClick()
            }, this.props.role.name);
        }

        handleClick() {
            this.props.onClick(this.props.role, this.props.selected);
        }
    }

    return class RoleFilter extends Plugin {
        constructor() {
            super();

            this.defaultSettings = {};
            this.defaultSettings.showAddRoleButton = true;
            this.defaultSettings.showLargeChannelWarning = true;

            this.useAnd = true;

            this.handleRolePillClick = this.handleRolePillClick.bind(this);
        }
        
        onStart() {
            this.initializeCss();
            this.patchRoles();
            this.patchMemberList();
            this.patchMemberListButton();
            this.patchRoleMention();
            
            document.addEventListener("click", this.handleRolePillClick, true);
        }

        onStop() {
            document.removeEventListener("click", this.handleRolePillClick, true);
            
            Patcher.unpatchAll();

            this.updateMemberList();

            // Unpatch right-click on memberlist button.
            this.patchMemberListButton(false);
            
            const roleClass = DiscordClassModules.PopoutRoles["role"];

            if(roleClass.includes("interactive")) {
                DiscordClassModules.PopoutRoles["role"] = roleClass.replace(" interactive","");
            }

            if (this.elementToRevertCSS) this.revertFilterCss();

            PluginUtilities.removeStyle("RoleFilterCSS");
        }

        onSwitch() {
            this.resetFilter();
            this.updateMemberList();
            this.patchMemberListButton();
            this.closePopout();
            this.showedWarning = false;
        }

        getSettingsPanel() {
            return Settings.SettingPanel.build(this.saveSettings.bind(this), 
                new Settings.Switch(
                    "Show \"Add Role\" Button", 
                    "Display a button to add roles to the filter at the top of the members list.",
                    this.settings.showAddRoleButton, 
                    (e) => {
                        this.settings.showAddRoleButton = e;
                        this.updateMemberList();
                    }
                ),
                new Settings.Switch(
                    "Show Large Channel Warning", 
                    "When enabled, displays a warning when using Role Filter on channels with 100+ members. Role Filter does not always show all members in channels over 100 members.", 
                    this.settings.showLargeChannelWarning, 
                    (e) => {this.settings.showLargeChannelWarning = e;})
            );
        }

        /**
         * Retrieves, caches, and returns guild id, 
         * which is reset every time guild is changed
         * @returns {number} Last selected Guild ID
         */
        getGuildId() {
            this.guildId = this.guildId || BdApi.findModuleByProps("getLastSelectedGuildId").getLastSelectedGuildId();

            return this.guildId;
        }

        /**
         * Apply plugin css. Supplies css for all custom component classes
         */
        initializeCss() {
            PluginUtilities.addStyle(
                "RoleFilterCSS", 
                roleFilterCss
            );
        }

        /**
         * Turns off the filter and re-renders the member list
         */
        resetFilter() {
            this.guildId = "";
            this.allRoles = null;
            this.filter = null;
            this.updateMemberList();
        }

        /**
         * Make roles interactive
         */
        patchRoles() {
            const roleClass = DiscordClassModules.PopoutRoles["role"];

            if(!roleClass.includes("interactive")) {
                DiscordClassModules.PopoutRoles["role"] += " interactive";
            }
        }

        /**
         * Adds right-click to filter option to member list button.
         */
        patchMemberListButton(patch = true) {
            const elem = document.querySelector('div[aria-label="Hide Member List"]');
            if (!elem) return;

            if (patch) elem.onmousedown = (e) => {
                if (e.which == 3) {
                    this.closePopout();
                    this.openPopout(e.target, 'svg');
                }
            };
            else elem.onmousedown = () => {};
        }

        /**
         * Renders the role pill when filtering. Watches for channel changes.
         */
        patchMemberList() {
            Patcher.after(Lists.ListThin, "render", (that, args, value) => {
                const [props] = args;
                
                if (!props || !props["data-list-id"] 
                    || !props["data-list-id"].startsWith("members")
                    // make sure the list is actually rendered before proceeding
                    || !value.ref || !value.ref.current) return value;

                const memberListContainer = ReactTools.getOwnerInstance(value.ref.current.parentElement)

                this.patchMemberListContainer(value);

                if (!this.channel || this.channel.id != memberListContainer.props.channel.id) {
                    // Logger.info("Channel change detected.");
                    // if a channel object isn't created, or if the channel has changed, create new channel
                    this.channel = new Channel(
                        memberListContainer.props.channel.id,
                        memberListContainer.props.rows
                    );
                }

                // always insert the element, even when not filtering
                // so that user popout does not close when clicking filter
                if (value) this.insertRoleElem(value);
                
                if (this.filter) this.applyFilterCss(value.ref.current);
                else if (this.elementToRevertCSS) this.revertFilterCss();

                return value;
            });
        }

        /**
         * Makes role mentions clickable, adds to filter
         */
        patchRoleMention() {
            const RoleMention = WebpackModules.getModule(m => m && m.default.displayName === "RoleMention");
            
            Patcher.after(RoleMention, "default", (_, [props], component) => {
                if (!component || !component.props 
                    || !props || props.type !== "mention"
                    || !props.roleId || props.children[0] ==='@everyone') return;

                const role = this.getRoleById(props.roleId);

                component.props.className += " interactive";
                component.props.onClick = (e) => this.toggleRole(role);
            });
        }

        /**
         * Alters the render functions in the member list container to follow filter behavior.
         * @param {React element} memberListElem the member list element
         */
        patchMemberListContainer(memberListElem) {
            const memberList = ReactTools.getOwnerInstance(memberListElem.ref.current.parentElement);
            
            Patcher.after(memberList, "renderRow", (that, args, value) => {
                if (!this.filter || !this.filter.membersAllowed || !value || !value.props || !value.props.user) return value;
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
         * Apply CSS to the elements which make up the members list.
         * Bypasses lazyload by forcing the container to be as tall 
         * as needed to render all members. Shrinks viewport and
         * makes it scrollable.
         * @param {HTML element} element The members list HTML element
         */
        applyFilterCss(element) {
            const filterElementHeight = element.children[0].offsetHeight,
                totalMemberHeight = this.filter.membersFound * memberHeight,
                totalSectionHeight = this.filter.sectionsFound * sectionHeight,
                filteredMemberHeight = this.filter.membersAllowed.length * memberHeight,
                filteredSectionHeight = Object.keys(this.filter.sectionsAllowed).length * sectionHeight,
                // get the amount of padding there should be at the bottom of the list
                bottomPadding = element.computedStyleMap().get("padding-bottom").value,
                roleButtonHeight = 30;

            // set the list height so that all members are rendered
            element.style.height = filterElementHeight 
                + totalSectionHeight 
                + totalMemberHeight 
                + roleButtonHeight + "px";
            element.style.removeProperty("overflow");

            const parentElement = element.parentElement;

            // set the membersWrap height to the height that all members would be rendered AFTER filtering
            parentElement.style.minHeight = filterElementHeight + filteredMemberHeight + filteredSectionHeight + bottomPadding + "px";
            parentElement.style.overflow = "hidden"

            const containerElement = parentElement.parentElement;

            // set the container to scroll through the list
            containerElement.style.overflowY = "scroll"
            // hide the scrollbar
            containerElement.classList.add("roleFilterWrap");

            this.elementToRevertCSS = element;
        }

        /**
         * Reverts all css adjustments made by applyFilterCss().
         */
        revertFilterCss() {
            const element = this.elementToRevertCSS;

            element.style.removeProperty("height");
            element.style.overflow = "hidden scroll";

            const parentElement = element.parentElement;

            parentElement.style.removeProperty("min-height");
            parentElement.style.removeProperty("overflow");

            const containerElement = parentElement.parentElement;

            containerElement.style.removeProperty("overflow-y");
            containerElement.classList.remove("roleFilterWrap");

            this.elementToRevertCSS = null;
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

            if (this.channel.rows.length >= 100) {
                this.showLargeChannelWarning();
            }

            return {
                maxIdx,
                groupList,
                membersList,
                sectionsFound,
                membersFound
            }
        }

        showLargeChannelWarning() {
            if(this.showedWarning || !this.settings.showLargeChannelWarning) return;

            Toasts.warning("This channel is large (approx. 100+ members). It's possible that not every member you're searching for will be found.");
            this.showedWarning = true;
        }
        
        /**
         * Gets role from the current guild with matching id.
         * @param {string} roleId
         * @returns {Role} Role with matching id in current guild
         */
        getRoleById(roleId) {
            const guild = GuildStore.getGuild(this.getGuildId());
            const role = guild.roles[roleId];

            return new Role(
                role.id,
                role.name,
                role.colorString || "#b9bbbe"
            );
        }

        /**
         * Generates, caches, and returns list of guild roles
         * @returns {Role[]} List of roles
         */
        getAllRoles() {
            this.allRoles = this.allRoles || this.generateAllRoles();
            return this.allRoles;
        }

        /**
         * Maps roles in the current guild to a Role object
         * @returns {Role[]} List of roles
         */
        generateAllRoles() {
            const guildRoles = GuildStore.getGuild(this.getGuildId()).roles;

            const roles = [];

            for(const roleId in guildRoles) {
                const guildRole = guildRoles[roleId];
                
                if (guildRole.name === "@everyone") continue;
                
                roles.push(new Role(
                    guildRole.id,
                    guildRole.name,
                    guildRole.colorString || "#b9bbbe"
                ));
            }
            return roles;
        }

        /**
         * Toggle a role in the filter list.
         * @param {Role} role Role to toggle
         */
        toggleRole(role) {
            if (!this.filter) {
                this.setFilter([role]);
                this.updateMemberList();
            }
            else if (this.filter.roles.some(filterRole => filterRole.id === role.id)) {
                this.removeRoleFromFilter(role.id);
            }
            else {
                this.addRoleToFilter(role);
            }
        }

        /**
         * Adds a role to the filter and updates the member list.
         * Creates a new filter if not already filtering.
         * @param {Role} newRole Role to add to filter
         */
        addRoleToFilter(newRole) {
            if (this.filter) {
                if(!this.filter.roles.some(role => role.id === newRole.id)) {
                    this.filter.roles.push(newRole);
                }
                
                this.setFilter(this.filter.roles);
            }
            else {
                this.setFilter([newRole]);
            }
            
            this.updateMemberList();
        }

        /**
         * Removes the id from the filter, if it exists.
         * @param {string} roleId ID of the role to remove
         */
         removeRoleFromFilter(roleId) {
            if (!this.filter) return;
            this.filter.roles = this.filter.roles.filter(role => role.id != roleId);
            this.setFilter(this.filter.roles);
            this.updateMemberList();
        }

        /**
         * Sets the filter object. Does not refresh list or apply the filter.
         * @param {Role[]} roles Array of roles included in the filter
         * @param {*} channelMembers Object which contains information on the filter
         */
        setFilter(roles) {
            if (!Array.isArray(roles) || !roles.length) {
                this.filter = null;
            }
            else {
                const channelMembers = this.getAllowedMembers(roles, this.useAnd);
                this.filter = new Filter(
                    roles,
                    channelMembers.membersList,
                    channelMembers.groupList,
                    channelMembers.membersFound,
                    channelMembers.sectionsFound
                );
            }
        }

        /**
         * Creates a RoleHeader component and inserts it above the member list
         * @param {React.element} membersListElem React element to add RoleFilter elements
         */
        insertRoleElem(membersListElem) {    
            if (!Array.isArray(membersListElem.props.children))
            membersListElem.props.children = [membersListElem.props.children];

            const roleHeader = React.createElement(RoleHeader, {
                onAddButtonClick: (event) => this.handleAddButtonClick(event),
                onRoleClick: (roleId) => this.handleRoleFilterClick(roleId),
                filter: this.filter,
                showAddRoleButton: this.settings.showAddRoleButton
            });

            membersListElem.props.children.unshift(roleHeader);
            membersListElem.props.children.unshift();
        }

        /**
         * Handles all click events. 
         * Filters out event if target's classes don't match role classes.
         * @param {MouseEvent} event The element to handle the click event on
         */
        handleRolePillClick(event) {
            let roleId = "";
            
            const target = event.target;

            if(target.classList.contains("roleFilter")) {
                return;
            } 
            else if (this.matchesClass(target, DiscordClassModules.PopoutRoles.role)) {
                roleId = this.getRoleId(target);
            }
            else if (this.matchesClass(target, DiscordClassModules.PopoutRoles.roleName) ||
                    this.matchesClass(target, DiscordClassModules.PopoutRoles.roleCircle)) {
                roleId = this.getRoleId(target.parentElement)
            }
            else {
                return;
            }

            if (event.stopPropogation) event.stopPropogation();

            // replace non-numerical characters in the id
            roleId = roleId.replace(/\D/g,"");

            this.toggleRole(this.getRoleById(roleId));
        }

        /**
         * Searches for a target classname in an html element
         * @param {HTML element} target The element to search
         * @param {string} classToMatch The className to search for
         * @returns {boolean} Whether classToMatch is found in target's classes
         */
        matchesClass(target, classToMatch) {
            return target.classList.contains(classToMatch) || target.className === classToMatch;
        }

        /**
         * Parses an element's attributes to retrieve the role id
         * @param {HTML element} elem Element representing a role id
         * @returns {string} The role id of the element
         */
        getRoleId(elem) {
            const roleId = elem.attributes["data-list-item-id"].value;
            return roleId && roleId.substr(roleId.indexOf("___", 3));
        }

        /**
         * Opens a role popout after closing the existing one.
         * @param {MouseEvent} event
         */
        handleAddButtonClick(event) {
            this.closePopout();
            
            this.openPopout(event.target);
            
            if (event.stopPropagation) event.stopPropagation();
        }

        /**
         * Opens a popout to add roles to the filter
         * @param {HTML Element} target The target element to open the popout next to
         * @param {string} tagTarget The html tag name to search for
         */
        openPopout(target, tagTarget = 'div') {
            // Return if in DM
            if ([
                1, // DM Channel type
                3  // Group DM Channel type
            ].includes(ChannelStore.getChannel(SelectedChannelStore.getChannelId()).type)) return;

            // If a child element is clicked on, popout would open in wrong place
            // Go up in parent tree until target tag is reached
            while(target.tagName.toLowerCase() !== tagTarget) {
                target = target.parentElement;
            }

            const popoutId = Popouts.openPopout(target, {
                position: "left",
                align: "top",
                spacing: 263,
                animation: Popouts.AnimationTypes.TRANSLATE,
                render: () => {
                    return React.createElement(RolePopout, {
                        onRoleSelect: (role) => this.addRoleToFilter(role),
                        onRoleDeselect: (role) => this.removeRoleFromFilter(role.id),
                        guildRoles: this.getAllRoles(),
                        selectedRoles: this.filter && this.filter.roles
                    });
                }
            });

            this.currentPopoutId = popoutId;
        }

        /**
         * Closes an open Role Filter popout, if one exists.
         */
        closePopout() {
            const openPopouts = document.querySelectorAll(`.${classes.popoutContainer}`);

            openPopouts.forEach(openPopout => openPopout.remove());
        }
        
        /**
         * Removes the specified role from the filter. Removes the filter if all filters are gone.
         * @param {string} roleId The ID of the role that was clicked on
         */
        handleRoleFilterClick(roleId) {
            this.removeRoleFromFilter(roleId);
            if (!this.filter) return;
            if (this.filter.roles.length === 0) this.resetFilter();
            this.updateMemberList();
        }
    };
};