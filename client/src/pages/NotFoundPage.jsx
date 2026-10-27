import { Link } from "react-router-dom";
import Container from "../components/layout/Container";

const NotFoundPage = () => (
  <Container>
    <div className="card-glass mx-auto max-w-lg rounded-3xl p-10 text-center">
      <p className="font-display text-6xl font-extrabold text-tide">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">
        The page you are looking for does not exist or has moved.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to shop
      </Link>
    </div>
  </Container>
);

export default NotFoundPage;
