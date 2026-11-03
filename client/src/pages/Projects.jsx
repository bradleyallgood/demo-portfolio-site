import { useOutletContext } from 'react-router';
import ProjectCard from '../components/ProjectCard.jsx';

export default function Projects() {
  const { projects } = useOutletContext();

  return (
    <div className="wrap page">
      <h1>Personal projects</h1>
      <p className="page-intro">Things I’ve made because I wanted to see if I could.</p>
      <div className="project-grid project-grid-wide">
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} detailed />
        ))}
      </div>
    </div>
  );
}
