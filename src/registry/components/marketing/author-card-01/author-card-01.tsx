import { memo, useId } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthorAvatar } from "./parts/avatar";
import { resolveTone } from "./parts/tone-resolver";
import { AUTHOR_CARD_DEFAULT_LABELS, type AuthorCard01Props } from "./types";

function AuthorCard01Inner(props: AuthorCard01Props) {
  const {
    name,
    role,
    bio,
    imageSrc,
    imageAlt,
    fallbackIcon = User,
    href,
    linkComponent,
    tone = "primary",
    headingAs: HeadingTag = "h3",
    labels,
    className,
    headingClassName,
    nameClassName,
    bioClassName,
  } = props;

  const nameId = useId();
  const toneClasses = resolveTone(tone);
  const resolvedLabels = { ...AUTHOR_CARD_DEFAULT_LABELS, ...labels };
  const resolvedAlt = imageAlt ?? name;

  const isClickable = Boolean(href);
  const RootEl = isClickable ? linkComponent ?? "a" : "div";

  const rootClass = cn(
    "block bg-card rounded-2xl p-6 border border-border/50 transition-colors",
    isClickable &&
      "hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    className
  );

  const linkProps = isClickable
    ? { href, "aria-labelledby": nameId }
    : {};

  return (
    <RootEl className={rootClass} {...linkProps}>
      <HeadingTag
        className={cn(
          "text-lg font-serif font-bold text-foreground mb-4",
          headingClassName
        )}
      >
        {resolvedLabels.heading}
      </HeadingTag>

      <div className="flex items-center gap-4">
        <AuthorAvatar
          imageSrc={imageSrc}
          imageAlt={resolvedAlt}
          fallbackIcon={fallbackIcon}
          toneClasses={toneClasses}
        />
        <div>
          <p
            id={nameId}
            className={cn("font-semibold text-foreground", nameClassName)}
          >
            {name}
          </p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>

      {bio ? (
        <p className={cn("text-sm text-muted-foreground mt-4", bioClassName)}>
          {bio}
        </p>
      ) : null}
    </RootEl>
  );
}

export const AuthorCard01 = memo(AuthorCard01Inner);
AuthorCard01.displayName = "AuthorCard01";
