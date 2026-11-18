import { useEffect, useState } from "react";
import { currentUser } from "./services/lists";


export default function App() {


  const [user, setUser] = useState(null);
  useEffect(() => { currentUser().then(setUser).catch(() => setUser(null)); }, []);
  if (!user) return <main><p>Sign in to access your profile settings.</p><a href="/login">Sign in</a></main>;
  return (
    <main>
      <h2>User settings page</h2>
    </main>
  );
}
