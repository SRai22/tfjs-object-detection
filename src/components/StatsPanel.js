export function setupStats() {
    const stats = new Stats();
    stats.customFpsPanel = stats.addPanel(new Stats.Panel('FPS', '#0ff', '#002'));
    stats.showPanel(stats.domElement.children.length - 1);
  
    const parent = document.getElementById('stats');
    parent.appendChild(stats.domElement);
  
    const statsPanes = parent.querySelectorAll('canvas');
  
    for (let i = 0; i < statsPanes.length; ++i) {
      statsPanes[i].style.width = '140px';
      statsPanes[i].style.height = '80px';
    }
    return stats;
  }