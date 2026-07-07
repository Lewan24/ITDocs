
import { useState } from 'react'
import reactLogo from '../../assets/react.svg'
import viteLogo from '../../assets/vite.svg'

export function HomePage() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section>
        <div className='flex justify-center mt-15'>
          <div className="flex flex-row gap-2">
            <img src={reactLogo} className="framework size-32" alt="React logo" />
            <img src={viteLogo} className="vite size-32" alt="Vite logo" />
          </div>
        </div>
        <div className='my-5'>
          <h1 className='text-center'>Get started</h1>
          <p className='text-center'>
            Edit <code className='hover:text-indigo-500 hover:underline'><b>src/app/pages/<i>HomePage.tsx</i></b></code> and save to test <code>HMR</code>
          </p>
        </div>
        <div className='flex flex-row justify-center'>
          <button
          type="button"
          className="border rounded p-2 bg-indigo-400
          hover:bg-indigo-300 hover:scale-105 active:scale-95 transition-all duration-200"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
        </div>
      </section>

      <section className='mt-15'>
        <div className='flex flex-col'>
          <div className='flex justify-center'>
            <svg className="size-16" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          </div>
          <h2 className='text-center'>Documentation</h2>
          <p className='text-center'>Your questions, answered</p>

          <div className='flex justify-center mt-5'>
            <div className='flex justify-center size-16'>
              <ul className='flex gap-7'>
                <li className='hover:scale-105 transition duration-200 active:scale-95'>
                  <a href="https://vite.dev/" target="_blank">
                    <img className="logo" src={viteLogo} alt="" />
                    Explore Vite
                  </a>
                </li>
                <li className='hover:scale-105 transition duration-200 active:scale-95'>
                  <a href="https://react.dev/" target="_blank">
                    <img className="button-icon" src={reactLogo} alt="" />
                    Learn more
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>


        <div className='mt-20 flex flex-col items-center'>
          <div className='flex flex-col items-center'>
            <svg className="size-16" role="presentation" aria-hidden="true">
              <use href="/icons.svg#social-icon"></use>
            </svg>
            <h2 className='text-center'>Connect with us</h2>
            <p className='text-center'>Join the Vite community</p>
          </div>

          <div>
            <ul className='flex justify-center gap-8 mt-4'>
              <li className='hover:scale-105 transition duration-200 active:scale-95 hover:text-indigo-500'>
                <a href="https://github.com/vitejs/vite" target="_blank" className='flex flex-col items-center'>
                  <svg
                    className="size-12"
                    role="presentation"
                    aria-hidden="true"
                  >
                    <use href="/icons.svg#github-icon"></use>
                  </svg>
                  GitHub
                </a>
              </li>
              <li className='hover:scale-105 transition duration-200 active:scale-95 hover:text-indigo-500'>
                <a href="https://chat.vite.dev/" target="_blank" className='flex flex-col items-center'>
                  <svg
                    className="size-12"
                    role="presentation"
                    aria-hidden="true"
                  >
                    <use href="/icons.svg#discord-icon"></use>
                  </svg>
                  Discord
                </a>
              </li>
              <li className='hover:scale-105 transition duration-200 active:scale-95 hover:text-indigo-500'>
                <a href="https://x.com/vite_js" target="_blank" className='flex flex-col items-center'>
                  <svg
                    className="size-12"
                    role="presentation"
                    aria-hidden="true"
                  >
                    <use href="/icons.svg#x-icon"></use>
                  </svg>
                  X.com
                </a>
              </li>
              <li className='hover:scale-105 transition duration-200 active:scale-95 hover:text-indigo-500'>
                <a href="https://bsky.app/profile/vite.dev" target="_blank" className='flex flex-col items-center'>
                  <svg
                    className="size-12"
                    role="presentation"
                    aria-hidden="true"
                  >
                    <use href="/icons.svg#bluesky-icon"></use>
                  </svg>
                  Bluesky
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
