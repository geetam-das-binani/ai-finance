import React from 'react'

const page =async ({params}) => {
  console.log(await params)
  return (
    <div className=''>page</div>
  )
}

export default page