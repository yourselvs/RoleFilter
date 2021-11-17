# RoleFilter

Click on a role inside a user's popout menu to filter the online user's list to user's with that role.

### Installation
1. Download [BetterDiscord](https://betterdiscord.app/)
2. Download the plugin file `release/RoleFilter.plugin.js`
3. Place the plugin file in your plugins folder (See BD's [FAQ](https://betterdiscord.app/FAQ))

### TODO
- ~~Display filter on the users list~~
- ~~Improve appearance of filter display (role color, pill shape, total users?)~~
- ~~**[X]** button to remove the filter~~ (keyboard shortcut too?)
- ~~Filtering on multiple roles~~
- Switch between AND/OR for multiple roles
- Add + button with popout for adding new roles to the filter
    - When not filtering, add it on right side of first section
    - Add search to role list in popout
- Right click to filter a role out (instead of in, which is default behavior)
- ~~Scale height of member list to number of members so that everyone is rendered~~
- Create setting on whether to display sections when filtering
- Display offline members in servers which have it disabled
    - Lock offline members display behind setting that has warning on it (they won't be clickable)
- Test if utilizing `Patcher.instead` will improve rendering performance on massive servers