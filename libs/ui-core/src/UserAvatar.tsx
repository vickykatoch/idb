export type UserAvatarProps = {
  name: string
  imageUrl?: string
  size?: number
}

type AvatarSize = 24 | 32 | 40 | 48

function normalizeSize(size: number): AvatarSize {
  if (size <= 24) {
    return 24
  }

  if (size <= 32) {
    return 32
  }

  if (size <= 40) {
    return 40
  }

  return 48
}

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function UserAvatar({ name, imageUrl, size = 32 }: UserAvatarProps) {
  const normalizedSize = normalizeSize(size)
  const avatarClassName = `ui-core-user-avatar ui-core-user-avatar--size-${normalizedSize}`

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        title={name}
        className={avatarClassName}
        width={normalizedSize}
        height={normalizedSize}
        loading="lazy"
      />
    )
  }

  return (
    <div role="img" aria-label={name} title={name} className={avatarClassName}>
      {getInitials(name)}
    </div>
  )
}
