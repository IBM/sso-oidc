import * as React from 'react';
import * as Router from 'react-router-dom';
import Login from './Login';

function App() {
  const [authenticated, setAuthenticated] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/check');
        const data = await res.json();

        setAuthenticated(data.valid);
      } catch (error) {}
    };

    fetchData();
  }, []);

  return (
    <Router.BrowserRouter>
      <>
        {authenticated ? (
          <Router.Switch>
            <Router.Route exact path="/">
              Logged in{' '}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch('/api/logout');
                    setAuthenticated(false);
                  } catch (error) {}
                }}
              >
                Log out
              </button>
            </Router.Route>
            <Router.Redirect to="/" />
          </Router.Switch>
        ) : (
          <Router.Switch>
            <Router.Route exact path="/Login">
              <Login
                onLogin={() => {
                  setAuthenticated(true);
                }}
              />
            </Router.Route>
            <Router.Redirect to="/Login" />
          </Router.Switch>
        )}
      </>
    </Router.BrowserRouter>
  );
}

export default App;
