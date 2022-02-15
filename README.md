# RoleFilter

Role Filter allows you to use Discord's roles to search for users. You can navigate channels in ways you never could before. Instantly see every user who has the "Moderator" role. What about moderators that also have the "Streamer" tag? And what about streamer moderators that also play League of Legends? Find any combination of roles instantly. 

### Filter using a custom popout
![roleFilter_popout](https://user-images.githubusercontent.com/14335486/154116979-f9d5e9f4-8e44-4b43-8ba5-17472d9202e8.gif)

### Filter on a user's roles
![roleFilter_user](https://user-images.githubusercontent.com/14335486/154116998-64d85aaf-7ba1-4677-b1d3-6976dc9aabb0.gif)

### Filter when a role gets mentioned
![roleFilter_mention](https://user-images.githubusercontent.com/14335486/154117020-b3ab68dc-8623-4a89-b38e-7ad8a432e389.gif)]

## Known issues
- Does not work in threads
- Some compatibility issues with themes
- Scrollbars don't always show up when filtering, or in the role popout
- Not always correct in channels with 100+ members
  - Due to Discord's lazy-loading, Role Filter can only look at the first 100 members in a channel
  - At the moment, a fix for this is not planned

## Installation
1. Download [BetterDiscord](https://betterdiscord.app/)
2. Download the plugin file `release/RoleFilter.plugin.js`
3. Place the plugin file in your plugins folder (See BD's [FAQ](https://betterdiscord.app/FAQ))

## Contributing

Put a PR in. Please have readable code.
