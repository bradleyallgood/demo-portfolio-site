import { useOutletContext } from 'react-router';
import ContactForm from '../components/ContactForm.jsx';

export default function Contact() {
  const { profile } = useOutletContext();

  return (
    <div className="wrap page contact">
      <div>
        <h1>Let’s talk.</h1>
        <p className="page-intro">Send me a note and I’ll get back to you.</p>
        <p className="contact-location">Based in {profile.location}</p>
      </div>
      <ContactForm />
    </div>
  );
}
