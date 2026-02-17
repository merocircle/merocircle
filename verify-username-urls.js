#!/usr/bin/env node

// Simple verification script to check username-based URLs are implemented
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying username-based creator URL implementation...\n');

// Check PostCard component
const postCardPath = path.join(__dirname, 'components/organisms/posts/PostCard.tsx');
const postCardContent = fs.readFileSync(postCardPath, 'utf8');

const postCardHasUsername = postCardContent.includes('vanity_username || creator.username || creator.id');
const postCardUsesSlug = postCardContent.includes('creatorSlug') && postCardContent.includes('/creator/${creatorSlug}');

console.log('✅ PostCard Component:');
console.log(`   - Uses username fields: ${postCardHasUsername ? '✅' : '❌'}`);
console.log(`   - Uses slug in URLs: ${postCardUsesSlug ? '✅' : '❌'}`);

// Check ActivityItem component
const activityItemPath = path.join(__dirname, 'components/dashboard/ActivityItem.tsx');
const activityItemContent = fs.readFileSync(activityItemPath, 'utf8');

const activityItemHasUsername = activityItemContent.includes('creatorVanityUsername || creatorUsername || creatorId');
const activityItemUsesSlug = activityItemContent.includes('creatorSlug') && activityItemContent.includes('openCreatorProfile(creatorSlug)');

console.log('\n✅ ActivityItem Component:');
console.log(`   - Uses username fields: ${activityItemHasUsername ? '✅' : '❌'}`);
console.log(`   - Uses slug in navigation: ${activityItemUsesSlug ? '✅' : '❌'}`);

// Check CreatorCard component
const creatorCardPath = path.join(__dirname, 'components/organisms/creators/CreatorCard.tsx');
const creatorCardContent = fs.readFileSync(creatorCardPath, 'utf8');

const creatorCardHasUsername = creatorCardContent.includes('vanityUsername || username || id');
const creatorCardUsesSlug = creatorCardContent.includes('creatorSlug') && creatorCardContent.includes('/creator/${creatorSlug}');

console.log('\n✅ CreatorCard Component:');
console.log(`   - Uses username fields: ${creatorCardHasUsername ? '✅' : '❌'}`);
console.log(`   - Uses slug in URLs: ${creatorCardUsesSlug ? '✅' : '❌'}`);

// Check CreatorMiniCard component
const creatorMiniCardPath = path.join(__dirname, 'components/common/CreatorMiniCard.tsx');
const creatorMiniCardContent = fs.readFileSync(creatorMiniCardPath, 'utf8');

const creatorMiniCardHasUsername = creatorMiniCardContent.includes('vanityUsername || username || id');
const creatorMiniCardUsesSlug = creatorMiniCardContent.includes('creatorSlug') && creatorMiniCardContent.includes('/creator/${creatorSlug}');

console.log('\n✅ CreatorMiniCard Component:');
console.log(`   - Uses username fields: ${creatorMiniCardHasUsername ? '✅' : '❌'}`);
console.log(`   - Uses slug in URLs: ${creatorMiniCardUsesSlug ? '✅' : '❌'}`);

// Check Dashboard Context
const dashboardContextPath = path.join(__dirname, 'contexts/dashboard-context.tsx');
const dashboardContextContent = fs.readFileSync(dashboardContextPath, 'utf8');

const dashboardHasSlug = dashboardContextContent.includes('viewingCreatorSlug') && dashboardContextContent.includes('openCreatorProfile(creatorSlug: string');

console.log('\n✅ Dashboard Context:');
console.log(`   - Uses creator slug: ${dashboardHasSlug ? '✅' : '❌'}`);

// Check Creator Page Route
const creatorPagePath = path.join(__dirname, 'app/creator/[slug]/page.tsx');
const creatorPageContent = fs.readFileSync(creatorPagePath, 'utf8');

const creatorPageNoUUID = !creatorPageContent.includes('UUID_REGEX.test(slug.trim())');
const creatorPageOnlyResolve = creatorPageContent.includes('/api/creator/resolve/') && !creatorPageContent.includes('/api/creator/${slug}');

console.log('\n✅ Creator Page Route:');
console.log(`   - Removed UUID fallback: ${creatorPageNoUUID ? '✅' : '❌'}`);
console.log(`   - Only uses resolve endpoint: ${creatorPageOnlyResolve ? '✅' : '❌'}`);

// Summary
const allChecks = [
  postCardHasUsername && postCardUsesSlug,
  activityItemHasUsername && activityItemUsesSlug,
  creatorCardHasUsername && creatorCardUsesSlug,
  creatorMiniCardHasUsername && creatorMiniCardUsesSlug,
  dashboardHasSlug,
  creatorPageNoUUID && creatorPageOnlyResolve
];

const passedChecks = allChecks.filter(Boolean).length;
const totalChecks = allChecks.length;

console.log('\n📊 Summary:');
console.log(`   - Passed: ${passedChecks}/${totalChecks} checks`);
console.log(`   - Status: ${passedChecks === totalChecks ? '✅ ALL GOOD' : '❌ Some issues found'}`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 Success! All components now use usernames instead of IDs for creator URLs.');
  console.log('\n📝 Implementation Summary:');
  console.log('   • PostCard uses vanity_username → username → ID fallback');
  console.log('   • ActivityItem uses vanity_username → username → ID fallback');
  console.log('   • CreatorCard uses vanityUsername → username → ID fallback');
  console.log('   • CreatorMiniCard uses vanityUsername → username → ID fallback');
  console.log('   • Dashboard context updated to handle creator slugs');
  console.log('   • Creator page route only accepts usernames (no UUID fallback)');
  console.log('   • All creator links now use /creator/{username} format');
} else {
  console.log('\n❌ Some components still need updates. Please review the failed checks above.');
}
