import LoginButton from '@/components/GoogleSignIn'
import YouTubeDataComponent from '@/components/YoutubeData'
import React from 'react'

type Props = {}

const page = (props: Props) => {
  return (
    <div>
        <LoginButton/>
        <YouTubeDataComponent/>
    </div>
  )
}

export default page