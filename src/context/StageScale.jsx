import { createContext, useContext } from 'react'

const StageScaleContext = createContext({
  scale: 1,
  isMobile: false,
  zoomedIn: false,
  scaleTransitioning: false,
})

function StageScaleProvider({
  scale = 1,
  isMobile = false,
  zoomedIn = false,
  scaleTransitioning = false,
  children,
}) {
  return (
    <StageScaleContext.Provider value={{ scale, isMobile, zoomedIn, scaleTransitioning }}>
      {children}
    </StageScaleContext.Provider>
  )
}

function useStageLayout() {
  return useContext(StageScaleContext)
}

export { StageScaleProvider, useStageLayout }
