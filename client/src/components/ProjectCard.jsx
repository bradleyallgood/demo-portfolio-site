export default function ProjectCard({ project, index, detailed = false }) {
  const { title, tagline, description, tech, liveUrl, repoUrl, imageUrl } = project;

  return (
    <article className={`project tone-${index % 4}`}>
      {imageUrl && <img src={imageUrl} alt={`Screenshot of ${title}`} loading="lazy" />}
      <div className="project-body">
        <h3>{title}</h3>
        <p className="project-tagline">{tagline}</p>
        {detailed && <p>{description}</p>}
        {tech.length > 0 && <p className="project-tech">{tech.join(' / ')}</p>}
        {(liveUrl || repoUrl) && (
          <p className="project-links">
            {liveUrl && (
              <a href={liveUrl} target="_blank" rel="noreferrer">
                Visit site<span className="sr-only"> for {title}</span>
              </a>
            )}
            {repoUrl && (
              <a href={repoUrl} target="_blank" rel="noreferrer">
                View code<span className="sr-only"> for {title}</span>
              </a>
            )}
          </p>
        )}
      </div>
    </article>
  );
}
