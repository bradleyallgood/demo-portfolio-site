import { useOutletContext } from 'react-router';
import PetCarousel from '../components/PetCarousel.jsx';

export default function About() {
  const { profile, skills, hobbies, pets } = useOutletContext();
  const [lead, ...rest] = profile.about.split(/\n\s*\n/);

  return (
    <div className="wrap page">
      <h1>About me</h1>

      <div className="about-story">
        <p className="lead">{lead}</p>
        {rest.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <section className="skills" aria-labelledby="skills-title">
        <h2 id="skills-title">What I work with</h2>
        <div className="skill-groups">
          {skills.map(({ category, items }) => (
            <div key={category}>
              <h3>{category}</h3>
              <ul className="tags">
                {items.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {hobbies.length > 0 && (
        <section className="hobbies" aria-labelledby="hobbies-title">
          <h2 id="hobbies-title">Hobbies</h2>
          <div className="hobby-grid">
            {hobbies.map((hobby) => (
              <article key={hobby.id}>
                <img src={hobby.imageUrl} alt={hobby.alt} width="1200" height="900" loading="lazy" />
                <h3>{hobby.title}</h3>
                <p>{hobby.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {pets.length > 0 && (
        <section className="pets" aria-labelledby="pets-title">
          <h2 id="pets-title">My pets</h2>
          <PetCarousel photos={pets} />
          {profile.petsAbout && <p className="pets-about">{profile.petsAbout}</p>}
        </section>
      )}
    </div>
  );
}
