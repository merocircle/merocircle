import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Avatar } from '../ui';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/theme';
import type { NotificationType } from '../../hooks/useNotifications';
import { Ionicons } from '@expo/vector-icons';

const NOTIFICATION_ICONS: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  like: 'heart',
  comment: 'chatbubble',
  payment: 'cash',
  follow: 'person-add',
  mention: 'at',
  announcement: 'notifications',
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  like: '#e04848',
  comment: '#3b82f6',
  payment: '#22c55e',
  follow: '#a855f7',
  mention: '#f59e0b',
  announcement: '#f97316',
};

export interface NotificationItemProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  user?: { id: string; name: string; avatar: string | null };
  onPress?: () => void;
  onMarkAsRead?: () => void;
  style?: ViewStyle;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export function NotificationItem({
  type,
  title,
  message,
  createdAt,
  isRead,
  user,
  onPress,
  onMarkAsRead,
  style,
}: NotificationItemProps) {
  const iconName = NOTIFICATION_ICONS[type];
  const iconColor = NOTIFICATION_COLORS[type];

  const handlePress = () => {
    if (!isRead && onMarkAsRead) onMarkAsRead();
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.wrapper,
        !isRead && styles.unread,
        pressed && styles.pressed,
        style,
      ]}
    >
      {user ? (
        <View style={styles.avatarWrap}>
          <Avatar
            source={user.avatar ? { uri: user.avatar } : null}
            fallback={user.name}
            size={40}
          />
          <View style={[styles.iconBadge, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={iconName} size={14} color={iconColor} />
          </View>
        </View>
      ) : (
        <View style={[styles.iconOnly, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={[styles.title, !isRead && styles.titleUnread]} numberOfLines={1}>{title}</Text>
        <Text style={styles.message} numberOfLines={2}>{message}</Text>
        <Text style={styles.time}>{formatTime(createdAt)}</Text>
      </View>
      {!isRead && <View style={styles.dot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderLeftWidth: 0,
  },
  unread: {
    backgroundColor: colors.accent + '40',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  pressed: { opacity: 0.9 },
  avatarWrap: { position: 'relative' },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOnly: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: '500', color: colors.foreground },
  titleUnread: { fontWeight: '700' },
  message: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
  time: { fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
});
