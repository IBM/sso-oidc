import * as React from 'react';
import { useLocation, useHistory } from 'react-router-dom';

function Login(props) {
  const history = useHistory();
  const location = useLocation();
  const [authUrl, setAuthUrl] = React.useState(null);

  React.useEffect(() => {
    const code = location.search.split('code=').pop();

    if (code !== undefined && code.length > 0) {
      const fetchData = async () => {
        try {
          const res = await fetch('/code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });
          const data = await res.json();

          if (data.user_id !== undefined) {
            props.onLogin();
            history.push('/');
          } else {
            history.push('/Login');
          }
        } catch (error) {}
      };

      fetchData();
    }
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/authUrl');
        const data = await res.json();

        setAuthUrl(data.url);
      } catch (error) {}
    };

    fetchData();
  }, []);

  return <div>{authUrl != null && <a href={authUrl}>Log in</a>}</div>;
}

export default Login;
