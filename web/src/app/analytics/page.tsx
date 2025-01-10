import HomeDashboard from '@/components/HomeDashboard'
import Suggestions from '@/components/Suggestions'
import TopPerformer from '@/components/TopPerformer'
import React from 'react'

type Props = {}

const page = (props: Props) => {
  return (
    <div>
        <HomeDashboard/>
        <hr className='py-4 container mx-auto' />
        <TopPerformer/>
        <hr className='py-4 container mx-auto' />
        <Suggestions/>
    </div>
  )
}

export default page