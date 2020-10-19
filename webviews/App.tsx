import React, { useEffect, useState } from 'react';

export default function App() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const task = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(task);
    };
  }, [setTime]);

  return <article>
    <h1>Hello World!</h1>
    <code>{time.toLocaleString()}</code>
  </article>;
}
