import { Link, useOutletContext } from 'react-router';
import ProjectCard from '../components/ProjectCard.jsx';

export default function Home() {
  const { profile, projects } = useOutletContext();
  const firstName = profile.name.split(' ')[0];
  const featured = projects.filter((project) => project.featured).slice(0, 3);

  return (
    <>
      <section className="wrap hero">
        <div>
          <h1>Hi, I’m {firstName}.</h1>
          <p className="hero-headline">{profile.headline}</p>
          <p className="hero-intro">{profile.intro}</p>
          <div className="actions">
            <Link className="button" to="/projects">
              See my projects
            </Link>
            <Link className="button button-quiet" to="/about">
              More about me
            </Link>
          </div>
        </div>
        {profile.photoUrl && (
          <img
            className="hero-photo"
            src={profile.photoUrl}
            alt={`Portrait of ${profile.name}`}
            width="900"
            height="1481"
          />
        )}
      </section>

      {featured.length > 0 && (
        <section className="wrap featured" aria-labelledby="featured-title">
          <div className="section-heading">
            <h2 id="featured-title">Things I’ve built</h2>
            <Link to="/projects">All projects</Link>
          </div>
          <div className="project-grid">
            {featured.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </section>
      )}

      <section className="invite">
        <div className="wrap">
          <h2>Want to work together?</h2>
          <Link className="button button-invert" to="/contact">
            Say hello
          </Link>
        </div>
      </section>
    </>
  );
}
