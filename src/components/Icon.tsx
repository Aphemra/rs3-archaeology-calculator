import "./Icon.css";

type Props = {
  icon_type: "materials" | "artefacts" | "collectors" | "mysteries" | "skills";
  id: string;
  title?: string;
  box?: boolean;
};

export default function Icon({ icon_type, id, title = "", box = true }: Props) {
  const source = `/icons/${icon_type}/${id}.png`;

  return (
    <span className={`container ${box ? "boxed" : ""}`} title={title}>
      <img
        className="image"
        src={source}
        loading="eager"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = "/icons/_missing.png";
        }}
      />
    </span>
  );
}
