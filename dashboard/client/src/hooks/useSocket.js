import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000'

let socket = null

/**
 * Get or initialize the singleton Socket.io instance
 */
export const getSocket = () => {
  if (!socket) {
    socket = io(socketUrl, {
      withCredentials: true,
      autoConnect: true,
    })

    socket.on('connect', () => {
      console.log('[socket] Connected to server:', socket.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('[socket] Disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('[socket] Connection error:', error.message)
    })
  }
  return socket
}

/**
 * Custom hook to subscribe to a Socket.io event with automatic cleanup.
 * Uses a ref for the callback to prevent unnecessary listener churn on re-renders.
 * 
 * @param {string} eventName - The socket event name to listen to.
 * @param {Function} callback - The event handler function.
 * @returns {import('socket.io-client').Socket} The shared socket client instance.
 */
export function useSocket(eventName, callback) {
  const callbackRef = useRef(callback)

  // Keep callback reference updated so listener doesn't run stale closures
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const s = getSocket()

    if (eventName && callback) {
      const handleEvent = (...args) => {
        if (callbackRef.current) {
          callbackRef.current(...args)
        }
      }

      s.on(eventName, handleEvent)

      return () => {
        s.off(eventName, handleEvent)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName])

  return getSocket()
}
