import { Link, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";
import { FiSettings } from "react-icons/fi";

const Navbar = () => {
  const { auth } = usePuterStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/auth");
  };

  return (
    <nav className="navbar">
      <Link to="/">
        <p className="text-2xl font-bold text-gradient">
          <span></span>RESUMATIC
        </p>
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/upload" className="primary-button w-fit">
          Upload Resume
        </Link>
        {auth.isAuthenticated && (
          <button onClick={handleLogout} className="secondary-button w-fit">
            Log Out
          </button>
        )}
        <div className="flex flex-col items-center justify-center gap-4">
          <Link to="/wipe" className="text-grey-600 w-fit text-2xl">
            <FiSettings />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
