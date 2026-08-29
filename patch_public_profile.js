const fs = require('fs');
const path = '/app/applet/src/components/PublicProfileView.tsx';
let code = fs.readFileSync(path, 'utf8');

const target = `<ProfileReadingLists 
                isOwner={false}
                overrideReadingLists={profile.readingLists || []}
                overrideBookmarks={profile.bookmarks || {}}
                overrideFollowedSeriesIds={profile.followedSeriesIds || []}
              />`;
const replacement = `<ProfileReadingLists 
                isOwnProfile={false}
                userId={userId}
                initialLists={profile.readingLists || []}
              />`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(path, code);
  console.log('Patched correctly');
} else {
  console.log('Target not found');
}
