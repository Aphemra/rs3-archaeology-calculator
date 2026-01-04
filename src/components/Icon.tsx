import "./Icon.css";

type Props = {
  icon_type: "materials" | "artefacts" | "collectors" | "mysteries" | "skills" | "utility";
  id: string;
  title?: string;
  box?: boolean;
  extension?: string;
};

const base = import.meta.env.BASE_URL;

export default function Icon({ icon_type, id, title = "", box = true, extension = "png" }: Props) {
  const source = `${base}icons/${icon_type}/${id}.${extension}`;

  return (
    <span className={`container ${box ? "boxed" : ""} type-${icon_type}`} title={title}>
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
