import React from 'react'
import { Card, CardContent} from '@/components/ui/card';
import { CircleAlert } from 'lucide-react';

type Props = {
    insight:string
}

const Insights = (props: Props) => {
  return (
    <Card className="rounded-2xl bg-gradient-to-b dark:from-neutral-900 via-neutral-600 dark:to-neutral-950 dark:text-white my-4">
        <CardContent className='p-4'>
        <div className='flex items-center space-x-2 text-xs text-neutral-300 py-2'>
            <CircleAlert size={20} className='rotate-180' />
            <span>Insights</span>
        </div>
        <p className="text-neutral-500 text-sm">
            {props.insight}
        </p>
        </CardContent>
    </Card>
  )
}

export default Insights