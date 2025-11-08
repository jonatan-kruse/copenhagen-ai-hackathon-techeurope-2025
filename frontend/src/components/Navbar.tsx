import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button
              variant={location.pathname === "/" ? "default" : "ghost"}
              className="font-medium"
            >
              Home
            </Button>
          </Link>
          <Link to="/admin">
            <Button
              variant={location.pathname === "/admin" ? "default" : "ghost"}
              className="font-medium"
            >
              Admin
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

