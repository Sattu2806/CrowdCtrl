import { Button } from '@/components/ui/button'
import { Circle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

type Props = {
    authorDisplayName:string
    textDisplay:string
    publishedAt:string
    ai_reply:string
    id:string
    textOriginal:string
    fetchData: () => Promise<void>
    video_id:string
    reply:any
}

const EachRepliedComment = (props: Props) => {
    const [loadingReplies, setLoadingReplies] = useState(false) // Loading state for replies
    const [loadingGenerate, setLoadingGenerate] = useState(false) // Loading state for replies
    const GenerateReplyAgain = async (commentId: string, comment: string) => {
        try {
          setLoadingGenerate(true); // Set loading state for specific comment
    
          const videoResponse = await fetch(`http://localhost:8001/chat_openai/?comment_Id=${commentId}&video_Id=${props.video_id}&comment=${comment}&type=generate_reply_again`, {
            method: 'GET',
            credentials: 'include',
          });
    
          if (videoResponse.ok) {
            await props.fetchData(); // Refetch data after generating reply
          } else {
            throw new Error('Failed to regenerate reply');
          }
        } catch (error) {
        //   setError((error as Error).message);
        } finally {
          setLoadingGenerate(false); // End loading state for specific comment
        }
    };

    const ReplyToComment = async (commentId: string, comment: string) => {
        try {
          setLoadingReplies(true); // Set loading state for specific comment
    
          const videoResponse = await fetch(`http://localhost:8001/reply-to-comment/?parent_comment_id=${commentId}&reply_text=${props.ai_reply}`, {
            method: 'GET',
            credentials: 'include',
          });
    
          if (videoResponse.ok) {
            await props.fetchData(); // Refetch data after generating reply
          } else {
            throw new Error('Failed to regenerate reply');
          }
        } catch (error) {
        //   setError((error as Error).message);
        } finally {
          setLoadingReplies(false); // End loading state for specific comment
        }
    };
  return (
    <div  className="border p-4 shadow-md rounded-2xl bg-gradient-to-b dark:from-neutral-900 via-neutral-600 dark:to-neutral-950 dark:text-white">
        <p className="font-semibold text-neutral-300">
        {props.authorDisplayName}
        </p>
        <p className="text-gray-700">
        {props.textDisplay}
        </p>
        <p className="text-gray-500 text-sm">
        {new Date(props.publishedAt).toLocaleString()}
        </p>
        <div className="rounded-md dark:bg-neutral-800 bg-neutral-200 p-2 m-2">
        <p className="col-span-10 dark:text-neutral-300">{props.reply}</p>
        {/* <div className="flex items-center space-x-5 mt-3">
            <Button onClick={() => ReplyToComment(props.id, props.ai_reply)}>
                {loadingReplies ? (
                    <Circle className="animate-spin text-blue-500" />
                ) : (
                    <></>
                )}
                <span>Reply</span>
            </Button>
            <Button
            onClick={() => GenerateReplyAgain(props.id,props.textOriginal)}
            disabled={loadingReplies} // Disable button while loading
            >
            {loadingGenerate ? (
                <Circle className="animate-spin text-blue-500" />
            ) : (
                <Sparkles />
            )}
            {loadingGenerate ? ' Regenerating...' : ' Regenerate'}
            </Button>
        </div> */}
        </div>
        <div className='p-1 px-3 italic text-slate-300'>
        <small>you have already replied to this comment, open full thread to do more actions.
          <Link href={`/`}>
          </Link>
        </small>
        </div>
        {/* <div className='p-4 px-10'>
            {comment.replies && comment.replies.comments.map((reply:any[],index:number) => (
            <div key={index}>
                <p className="font-semibold text-neutral-300">
                    {comment.snippet.topLevelComment.snippet.authorDisplayName}
                </p>
                <p className="text-gray-700">
                    {comment.snippet.topLevelComment.snippet.textDisplay}
                </p>
                <p className="text-gray-500 text-sm">
                    {new Date(comment.snippet.topLevelComment.snippet.publishedAt).toLocaleString()}
                </p>
            </div>
            ))}
        </div> */}
    </div>
  )
}

export default EachRepliedComment