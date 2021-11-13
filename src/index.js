module.exports = (Plugin, Library) => {
    const {DiscordClasses, DiscordModules, DiscordSelectors, DOMTools, Logger, Patcher, Popouts, ReactTools, Toasts, Utilities, WebpackModules} = Library;

    const {GuildStore, GuildMemberStore, ImageResolver, React, UserStore } = DiscordModules;

    const Lists = WebpackModules.getByProps('ListThin');
    const Guilds = WebpackModules.getByProps('wrapper', 'unreadMentionsIndicatorTop');

    const rootClass = DiscordClasses.PopoutRoles.root.value,
        roleClass = DiscordClasses.PopoutRoles.role.value + " bodyInnerWrapper-26fQXj interactive roleFilter",
        roleCircleClass = DiscordClasses.PopoutRoles.roleCircle.value + " roleFilter",
        roleNameClass = DiscordClasses.PopoutRoles.roleName.value + " roleFilter",
        memberClass = " member-3-YXUe container-2Pjhx-",
        memberLayoutClass = " layout-2DM8Md",
        avatarWrapperDivClass = "avatar-3uk_u9",
        avatarWrapperClass = "wrapper-3t9DeA",
        maskClass = "mask-1l8v16 svg-2V3M55",
        avatarStackClass = "avatarStack-2Dr8S9",
        avatarClass = "avatar-VxgULZ",
        pointerEventsClass = "pointerEvents-2zdfdO",
        contentClass = "content-3QAtGj",
        nameAndDecoratorsClass = "nameAndDecorators-5FJ2dg",
        nameClass = "name-uJV0GL",
        roleColorClass = "roleColor-rz2vM0 desaturateUserColors-1gar-1";


    const Role = class Role extends React.Component {
        constructor(props) {
            super(props);
            this.onClick = this.onClick.bind(this);
        }
        
        onClick() {
            this.props.onClick();
        }

        render() {
            return React.createElement('div', {
                className: rootClass,
                style: {
                    padding: "24px 8px 0px 16px"
                }
            },
                React.createElement('div', {
                    className: roleClass,
                    onClick: this.onClick
                },
                    React.createElement('div', {
                        className: roleCircleClass,
                        style: {backgroundColor: this.props.color}
                    }),
                    React.createElement('div', {className: roleNameClass},
                        this.props.name
                    )
                )
            )
        }
    }

    const User = class User extends React.Component {
        constructor(props) {
            super(props);
        }

        render() {
            return React.createElement('div', {
                className: memberClass
            },
                React.createElement('div', {className: memberLayoutClass},
                    React.createElement('div', {className: avatarWrapperDivClass}, 
                        React.createElement('div', {
                            className: avatarWrapperClass,
                            role: "img",
                            style: {width: "32px", height: "32px"}
                        },
                            React.createElement('svg', {
                                className: maskClass,
                                width: "40", height: "32", viewBox: "0 0 40 32"
                            },
                                React.createElement('foreignObject', {
                                    x: "0", y: "0", width: "32", height: "32", 
                                    clipPath: "circle(16px at center)"
                                }, 
                                    React.createElement('div', {className: avatarStackClass},
                                        React.createElement('img', {
                                            className: avatarClass,
                                            src: ImageResolver.getUserAvatarURL(this.props.user)
                                        })
                                    )
                                )
                            )
                        )
                    ),
                    React.createElement('div', {className: contentClass},
                        React.createElement('div', {className: nameAndDecoratorsClass},
                            React.createElement('div', {className: nameClass},
                                React.createElement('span', {
                                    className: roleColorClass,
                                    style: {color: this.props.color}
                                },
                                    this.props.username
                                )
                            )
                        )
                    )
                )
            );
        }
    }

    return class RoleFilter extends Plugin {
        constructor() {
            super();

            this.guildId = "";
            this.roleName = null;
            this.roleStyle = "";
            this.usersAllowed = null;
            this.handleRoleClick = this.handleRoleClick.bind(this);
            this.resetFilter = this.resetFilter.bind(this);
        }
        
        onStart() {
            this.patchRoles();
            this.patchGuilds();
            this.patchMemberList();

            document.addEventListener("click", this.handleRoleClick, true);
            
            Toasts.info(`${this.name} ${this.version} has started!`);
        }

        onStop() {
            const roleModule = WebpackModules.getByProps("role")
            
            if(roleModule.role.includes(" interactive")) {
                roleModule.role = roleModule.role.replace(" interactive","");
            }

            document.removeEventListener.bind(document, "click", this.handleRoleClick, true);
            
            Patcher.unpatchAll();

            this.updateMemberList();

            Toasts.info(`${this.name} ${this.version} has stopped!`);
        }

        resetFilter() {
            this.guildId = "";
            this.usersAllowed = null;
            this.updateMemberList();
        }

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
                    this.resetFilter();
                }

                return value;
            });
        }

        patchMemberList() {
            Patcher.after(Lists.ListThin, 'render', (that, args, value) => {
                const [props] = args;
                if (!this.usersAllowed || !Array.isArray(this.usersAllowed) || !this.usersAllowed.length) return value;
                if (!props || !props['data-list-id'] || !props['data-list-id'].startsWith('members')) return value;

                const membersChild = value.props.children;
                
                const roleReactElem = React.createElement(Role, {
                    color: this.roleStyle,
                    name: this.roleName,
                    onClick: this.resetFilter
                });

                value.props.children = [
                    roleReactElem,
                    membersChild
                ];

                const usersFound = [];
                
                const target = Array.isArray(value)
                    ? value.find((i) => i && !i.key)
                    : value;
                const childProps = this.getProps(target.props.children[1], 'props.children.props');
                if (!childProps) return value;
                const children = this.getProps(childProps, 'children');
                if (!children || !Array.isArray(children)) return value;
                if (!this.usersAllowed || !Array.isArray(this.usersAllowed) || !this.usersAllowed.length) return value;
                
                childProps.children = children.filter((user) => {
                    if (!user.key || !user.key.startsWith('member')) return true;
                    const { 1: id } = user.key.split('-');
                    const userAllowed = this.usersAllowed.map(user => user.userId).includes(id);
                    
                    userAllowed && usersFound.push(id);

                    return userAllowed;
                }).map((entry, i, arr) => {
                    // hide groups with no users under them
                    if (!entry) return null;
                    const { key } = entry;
                    const next = arr[i + 1];
                    const sect = (item) => item && item.key.startsWith('section-');
                    const bool = sect(next);
                    if (key.startsWith('section-') && bool) return null;
                    return entry;
                });

                for (var member of this.usersAllowed) {
                    if (usersFound.includes(member.userId)) {
                        continue;
                    }

                    const user = UserStore.getUser(member.userId);

                    const userElement = React.createElement(User, {
                        user: user,
                        username: member.nick ? member.nick : user.username,
                        color: member.colorString
                    });

                    childProps.children.push(userElement);
                }


                return value;
            });

            this.updateMemberList();
        }

        updateMemberList() {
            const memberList = document.querySelector(DiscordSelectors.MemberList.members.value.trim());
            if (!memberList) return;
            const owner = ReactTools.getOwnerInstance(memberList);
            owner.forceUpdate();
            if (owner.handleScroll) owner.handleScroll();
        }

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

        handleRoleClick({ target }) {
            let roleName = "";
            let roleStyle = "";

            if(!this.guildId || target.classList.contains("roleFilter")) {
                return;
            } 
            else if (target.classList.contains("role-2irmRk")) {
                roleName = target.children[1].innerText;
                roleStyle = target.children[0].style.backgroundColor;
            }
            else if (target.classList.contains("roleName-32vpEy")) {
                roleName = target.innerText;
                roleStyle = target.previousElementSibling.style.backgroundColor;
            }
            else if (target.classList.contains("roleCircle-3xAZ1j")) {
                roleName = target.nextSibling.innerText;
                roleStyle = target.style.backgroundColor
            }
            else {
                return;
            }
            
            const rolesObj = GuildStore.getGuild(this.guildId).roles;

            const roleIds = [];

            for (const roleId in rolesObj) {
                const role = rolesObj[roleId];
                if(role.name && role.name === roleName) {
                    roleIds.push(roleId);
                }
            }
            
            const members = GuildMemberStore.getMembers(this.guildId)
                .filter(member => 
                    member.roles.some(roleId => 
                        roleIds.includes(roleId)
                    )
                );

            this.roleName = roleName;
            this.roleStyle = roleStyle;
            
            Toasts.success(`Clicked on role: "${roleName}". Members found: ${members.length}`);
            Logger.info("Clicked on role:", roleName , ". Role ids found:", roleIds, ". Members found:", members);

            if(roleIds.length > 1) {
                Toasts.info(`Found ${roleIds.length} overlapping roles with the same name. All roles are included in the filtered member list.`);
            }

            this.usersAllowed = members;

            this.updateMemberList();
        }

        /**
         * @name safelyGetNestedProps
         * @author Zerebos
         */
        getProps(obj, path) {
            return path.split(/\s?\.\s?/).reduce((object, prop) => object && object[prop], obj);
        }
    };
};