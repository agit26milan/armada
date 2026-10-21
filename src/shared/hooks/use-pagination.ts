

export const usePagination = () => {
    function parseOffset(link?: string): number | null {
        if (!link) {
          return null
        }
      
        try {
          const offset = Number(new URL(link).searchParams.get('page[offset]'))
      
          return Number.isFinite(offset) ? offset : null
        } catch {
          return null
        }
      }
    return {
        parseOffset,
    }
}
