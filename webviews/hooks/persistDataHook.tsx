import { useEffect, useRef } from 'react';
import { persistData, removeDataPersist } from 'webviews/store/appStore';

const persistDataHook = () => {
  const effect = useRef(() => {
  });

  useEffect(() => {
    effect.current = persistData();

    return () => {
      removeDataPersist(effect.current);
    };
  }, []);

  return effect.current;
}

export default persistDataHook;
