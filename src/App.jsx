import React from 'react'
import Toolbar from './components/toolbar/Toolbar'
import StatusBar from './components/toolbar/StatusBar'
import Canvas from './components/canvas/Canvas'

export default function App() {
  return (
    <div className="flex flex-col w-full h-full bg-slate-900">
      <Toolbar />
      <main className="flex flex-1 overflow-hidden">
        <Canvas />
      </main>
      <StatusBar />
    </div>
  )
}
