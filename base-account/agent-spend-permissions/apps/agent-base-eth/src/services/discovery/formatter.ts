import { X402Resource } from '@agent-spend-permissions/shared-types'

export class DataFormatter {
  static toMarkdown(resources: X402Resource[]): string {
    let markdown = '# Available Services\\n\\n'
    
    for (const resource of resources) {
      markdown += `## ${resource.name}\\n`
      markdown += `${resource.description}\\n\\n`
      markdown += `**Endpoint:** \`${resource.endpoint}\`\\n\\n`
      markdown += '**Pricing:**\\n'
      
      for (const tier of resource.pricing) {
        markdown += `- ${tier.tool}: $${tier.price}`
        if (tier.description) {
          markdown += ` - ${tier.description}`
        }
        markdown += '\\n'
      }
      markdown += '\\n'
    }
    
    return markdown
  }

  static toHTML(resources: X402Resource[]): string {
    let html = '<div class="services">'
    
    for (const resource of resources) {
      html += '<div class="service">'
      html += `<h2>${resource.name}</h2>`
      html += `<p>${resource.description}</p>`
      html += `<code>${resource.endpoint}</code>`
      html += '<ul>'
      
      for (const tier of resource.pricing) {
        html += `<li>${tier.tool}: $${tier.price}`
        if (tier.description) {
          html += ` - ${tier.description}`
        }
        html += '</li>'
      }
      html += '</ul></div>'
    }
    
    html += '</div>'
    return html
  }

  static toChart(resources: X402Resource[]): any {
    // Generate chart data for visualization
    return {
      type: 'bar',
      data: {
        labels: resources.map(r => r.name),
        datasets: [{
          label: 'Service Pricing',
          data: resources.map(r => {
            const avgPrice = r.pricing.reduce((sum, p) => sum + parseFloat(p.price), 0) / r.pricing.length
            return avgPrice
          })
        }]
      }
    }
  }
}