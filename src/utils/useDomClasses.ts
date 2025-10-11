
export function useDomClasses() {
  const [domClasses, setDomClasses] = useState<string[]>([]);

  const scanDomForClasses = () => {
    const classSet = new Set<string>();
    
    // Get all elements in the document
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(element => {
      const classList = element.classList;
      classList.forEach(className => {
        if (className.trim()) {
          classSet.add(className);
        }
      });
    });
    
    return Array.from(classSet).sort();
  };

  useEffect(() => {
    // Initial scan
    setDomClasses(scanDomForClasses());

    // Create a MutationObserver to watch for changes
    const observer = new MutationObserver((mutations) => {
      let shouldRescan = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          shouldRescan = true;
        } else if (mutation.type === 'childList') {
          shouldRescan = true;
        }
      });
      
      if (shouldRescan) {
        setDomClasses(scanDomForClasses());
      }
    });

    // Start observing
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true
    });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  return domClasses;
}