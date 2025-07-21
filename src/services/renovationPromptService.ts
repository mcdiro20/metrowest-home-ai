export class RenovationPromptService {
  static generateRenovationPrompt(styleChoice: string, imageAnalysis: string): string {
    const basePrompt = `Transform this interior space into a renovated version while maintaining EXACTLY the same:
- Room layout and dimensions  
- Window and door positions and sizes
- Architectural elements (beams, columns, built-ins)
- Overall perspective and camera angle
- Lighting direction and quality
- Floor plan and spatial relationships
- ${imageAnalysis}

CRITICAL: This must look like the SAME ROOM after renovation, not a different space. Keep the bones of the room identical - only update finishes, fixtures, furniture, and decor in the ${styleChoice} style.

RENOVATION APPROACH: Think of this as a makeover of the existing space, not building a new room. Preserve all structural elements while updating surfaces, colors, fixtures, and furniture.`;

    const stylePrompts = {
      'modern-minimalist': `Style: Modern Minimalist
- Clean lines with neutral color palette (whites, light grays, warm blacks)
- Sleek cabinetry with handleless doors or minimal hardware
- Quartz, marble, or concrete countertops
- Stainless steel, matte black, or integrated appliances
- Minimal decorative elements and clutter-free surfaces
- LED strip lighting, geometric pendant lights
- Natural materials like light oak or concrete accents
- Simple, functional furniture with clean silhouettes`,

      'farmhouse-chic': `Style: Farmhouse Chic  
- White or cream painted cabinetry with traditional hardware (cup pulls, knobs)
- Butcher block, marble, or white quartz countertops
- White subway tile or natural stone backsplashes
- Shiplap walls, beadboard, or wainscoting accents
- Vintage-inspired fixtures (lanterns, mason jar lights)
- Reclaimed wood elements and rustic textures
- Farmhouse sink, vintage-style faucets
- Cozy textiles, fresh flowers, and country accessories`,

      'transitional': `Style: Transitional
- Perfect blend of traditional and contemporary elements
- Warm neutral colors (warm beiges, soft grays, creamy whites)
- Shaker-style or raised panel cabinetry
- Natural stone, marble, or engineered quartz countertops  
- Classic subway tile or natural stone backsplashes
- Brushed nickel, oil-rubbed bronze, or brass fixtures
- Mix of traditional and modern furniture styles
- Timeless patterns and comfortable, livable design`,

      'coastal-new-england': `Style: Coastal New England
- Light, airy color palette (crisp whites, soft blues, seafoam greens)
- White or light blue painted cabinetry (possibly weathered finish)
- Natural materials like driftwood, stone, and rope details
- Glass tile, subway tile, or natural stone backsplashes
- Nautical-inspired hardware (rope details, anchor motifs)
- Natural fiber rugs, coastal artwork, and sea glass accents
- Fresh, beachy vibe without overly kitschy nautical themes
- Wicker furniture and natural textures`,

      'contemporary-luxe': `Style: Contemporary Luxe
- Sophisticated color palette (charcoal grays, deep blacks, rich jewel tones)
- High-gloss lacquered or matte luxury cabinetry
- Premium materials (marble, granite, quartzite, exotic woods)
- Designer fixtures and statement lighting (chandeliers, artistic pendants)
- High-end appliances with seamless integration
- Bold architectural details and custom millwork
- Luxury furniture with rich textures (velvet, leather, silk)
- Curated art pieces and sophisticated accessories`,

      'eclectic-bohemian': `Style: Eclectic Bohemian
- Warm, rich color palette with jewel tones (deep blues, emerald greens, burnt oranges)
- Mix of natural wood cabinetry or painted in warm, earthy hues
- Unique patterned tiles for backsplashes (Moroccan, geometric, hand-painted)
- Vintage brass, copper, or artisanal fixtures and hardware
- Global-inspired accessories (tapestries, carved wood, ceramics)
- Abundant plants and natural elements
- Layered textiles, vintage rugs, and eclectic artwork
- Mix of furniture styles and eras with personality`
    };

    const selectedStylePrompt = stylePrompts[styleChoice as keyof typeof stylePrompts] || stylePrompts['modern-minimalist'];

    return `${basePrompt}\n\n${selectedStylePrompt}\n\nRemember: This is a renovation of the EXISTING space shown in the image. Maintain the exact same room layout, architectural features, and spatial relationships while applying the style transformation.`;
  }

  static createFallbackPrompt(styleChoice: string): string {
    return `Create a ${styleChoice} style interior renovation that maintains the original room's layout, dimensions, and architectural features. Focus on updating finishes, fixtures, and furniture while preserving the spatial arrangement and structural elements of the existing space.`;
  }
}