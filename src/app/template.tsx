"use client"

import { PageContainer } from "@/components/layout/page-container"

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <PageContainer>
      {children}
    </PageContainer>
  )
} 