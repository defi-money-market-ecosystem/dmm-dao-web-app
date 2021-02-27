import React from 'react'
import FarmPanel from './FarmPanel'


export default function Farm({ params, language }) {

  return (
    <>
      <FarmPanel params={params} language={language}/>
    </>
  )


}