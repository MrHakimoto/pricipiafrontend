'use client';

import { useEffect } from 'react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

interface Props {
  loading: boolean;
}

export default function ProgressBar({ loading }: Props) {
  useEffect(() => {
    if (loading) {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [loading]);

  NProgress.configure({
  speed: 200, // padrão é 200ms, reduza para acelerar
  trickleSpeed: 100, // padrão é 200ms
  showSpinner: false,
});

  return null;
}