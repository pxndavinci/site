// Server component: renders text already split into tokens, one <span> each.
// The words are all in the HTML from the start. The streamer only flips each
// span from hidden to shown, so the layout never moves (no layout shift) and a
// visitor without JavaScript simply sees the whole page.
import { Fragment, type ElementType } from "react";
import { tokenize } from "./tokenize";

export function StreamText({
  text,
  as: Tag = "span",
  className,
}: {
  text: string;
  as?: ElementType;
  className?: string;
}) {
  return (
    <Tag className={className}>
      {tokenize(text).map((tok, i) => {
        // The space before a word stays outside its span, so effects on the
        // word (the dotted "unsure" underline) never touch the space.
        const word = tok.trimStart();
        const lead = tok.slice(0, tok.length - word.length);
        return (
          <Fragment key={i}>
            {lead}
            <span className="t">{word}</span>
          </Fragment>
        );
      })}
    </Tag>
  );
}
