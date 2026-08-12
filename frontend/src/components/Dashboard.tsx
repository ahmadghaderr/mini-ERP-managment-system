export default function Dashboard() {
  const userJson = localStorage.getItem('currentUser');
  const user = userJson ? JSON.parse(userJson) : null;

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome, {user?.fullName} ({user?.role})</p>
    </div>
  );
}