'use client';

import { redirect, useParams } from 'next/navigation'


export default function Dashboard() {
    const { uuid } = useParams() as { uuid: string };
    redirect(`/dashboard/${uuid}/alcance`)
  return (
    <div>
      <h1>Hello Page</h1>
    </div>
  );
}