module.exports = (Plugin, Library) => {
    const {WebpackModules, Logger, DiscordModules, Patcher, Toasts} = Library;

    const GuildStore = DiscordModules.GuildStore;
    const GuildMemberStore = DiscordModules.GuildMemberStore;

    return class RoleFilter extends Plugin {
        constructor() {
            super();

            this.guildId = "";

            this.linkRole = this.linkRole.bind(this);
        }
        
        onStart() {
            this.patchRoles();

            document.addEventListener("click", this.linkRole, true);
            this.stop = document.removeEventListener.bind(document, "click", this.linkRole, true);
        }

        onStop() {
            const roleModule = WebpackModules.getByProps("role")
            
            if(roleModule.role.includes(" interactive")) {
                roleModule.role.replace(" interactive","");
            }
            
            Patcher.unpatchAll();
        }

        patchRoles() {
            const roleModule = WebpackModules.getByProps("role")
            
            if(!roleModule.role.includes("interactive")) {
                roleModule.role += " interactive"
            }
            
            const RoleObj = WebpackModules.getModule(m => m?.default.displayName === 'UserPopoutBody');
            Patcher.after(RoleObj, "default",  (_, [props], component) => {
                if (!component || !component.props || !component.props.className) return;

                this.guildId = props.guild.id;
            });
        }

        linkRole({ target }) {
            let roleName = "";

            if(!this.guildId) {
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
            
            Toasts.success("Clicked on role: \"" + roleName + "\". Members found: " + members.length);

            if(roleIds.length > 1) {
                Toasts.info("Found " + roleIds.length + " overlapping roles with the same name. All roles are included in the filtered member list.");
            }
        }
    };
};