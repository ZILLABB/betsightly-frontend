import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
      <h1 className="text-6xl md:text-8xl font-bold premium-text mb-6">404</h1>
      <h2 className="text-2xl md:text-3xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button variant="premium" size="lg" asChild>
        <Link to="/">Return Home</Link>
      </Button>
    </div>
  );
};

export default NotFoundPage;
