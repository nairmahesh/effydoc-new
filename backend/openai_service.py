import openai
import os
from typing import List, Dict, Any
from models import RFPGenerationRequest, DocumentSection, AIRecommendation
import logging
import json

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        self.client = None
        self.api_key = None
        self.initialize_client()
    
    def initialize_client(self):
        """Initialize OpenAI client with API key"""
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            logger.warning("OpenAI API key not found. AI features will be disabled.")
            return
        
        try:
            # Set the API key for the openai module
            openai.api_key = self.api_key
            # Create OpenAI client instance
            self.client = openai.OpenAI(api_key=self.api_key)
            logger.info("OpenAI client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")

    async def generate_rfp_content(self, request: RFPGenerationRequest) -> List[DocumentSection]:
        """Generate RFP content using OpenAI"""
        if not self.client or not self.api_key:
            raise Exception("OpenAI client not initialized. Please check API key configuration.")
        
        try:
            prompt = self._create_rfp_prompt(request)
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert RFP writer. Generate comprehensive, professional RFP content in structured sections. Always respond in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=4000
            )
            
            content = response.choices[0].message.content
            sections = self._parse_rfp_response(content)
            
            return sections
            
        except Exception as e:
            logger.error(f"Error generating RFP content: {e}")
            raise Exception(f"Failed to generate RFP: {str(e)}")

    def _create_rfp_prompt(self, request: RFPGenerationRequest) -> str:
        """Create detailed prompt for RFP generation"""
        prompt = f"""
Generate a comprehensive Request for Proposal (RFP) document with the following specifications:

**Project Details:**
- Project Type: {request.project_type}
- Industry: {request.industry}
- Budget Range: {request.budget_range}
- Timeline: {request.timeline}

**Requirements:**
{request.requirements}

**Company Information:**
{request.company_info}

**Specific Deliverables:**
{', '.join(request.specific_deliverables)}

**Evaluation Criteria:**
{', '.join(request.evaluation_criteria)}

**Additional Context:**
{request.additional_context or 'None provided'}

Please structure the RFP with the following sections:
1. Executive Summary
2. Project Overview
3. Scope of Work
4. Requirements & Specifications
5. Deliverables
6. Timeline & Milestones
7. Budget & Pricing
8. Evaluation Criteria
9. Submission Guidelines
10. Terms & Conditions

IMPORTANT: Format the response as valid JSON with this exact structure:
{{
  "sections": [
    {{
      "title": "Section Title",
      "content": "Detailed content for this section",
      "order": 1
    }}
  ]
}}

Make it professional, comprehensive, and industry-appropriate. Ensure all content is realistic and detailed.
"""
        return prompt

    def _parse_rfp_response(self, content: str) -> List[DocumentSection]:
        """Parse OpenAI response into DocumentSection objects"""
        try:
            # Clean the content to ensure it's valid JSON
            content = content.strip()
            if content.startswith('```json'):
                content = content[7:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()
            
            # Try to parse as JSON first
            if content.startswith('{'):
                data = json.loads(content)
                sections = []
                for i, section_data in enumerate(data.get('sections', [])):
                    section = DocumentSection(
                        title=section_data.get('title', f'Section {i+1}'),
                        content=section_data.get('content', ''),
                        order=section_data.get('order', i+1)
                    )
                    sections.append(section)
                return sections
            
            # Fallback: parse as text
            sections = self._parse_text_response(content)
            return sections
            
        except Exception as e:
            logger.error(f"Error parsing RFP response: {e}")
            # Return as single section if parsing fails
            return [DocumentSection(
                title="Generated RFP Content",
                content=content,
                order=1
            )]

    def _parse_text_response(self, content: str) -> List[DocumentSection]:
        """Parse text response into sections"""
        sections = []
        lines = content.split('\n')
        current_section = None
        current_content = []
        order = 1
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if line looks like a section header
            if (line.startswith('#') or 
                line.isupper() or 
                any(keyword in line.lower() for keyword in ['summary', 'overview', 'scope', 'requirements', 'deliverables', 'timeline', 'budget', 'evaluation', 'submission', 'terms'])):
                
                # Save previous section
                if current_section and current_content:
                    sections.append(DocumentSection(
                        title=current_section,
                        content='\n'.join(current_content),
                        order=order
                    ))
                    order += 1
                
                # Start new section
                current_section = line.replace('#', '').strip()
                current_content = []
            else:
                current_content.append(line)
        
        # Save last section
        if current_section and current_content:
            sections.append(DocumentSection(
                title=current_section,
                content='\n'.join(current_content),
                order=order
            ))
        
        return sections if sections else [DocumentSection(
            title="Generated Content",
            content=content,
            order=1
        )]

    async def analyze_document_performance(self, document_data: Dict[str, Any], performance_data: Dict[str, Any]) -> List[AIRecommendation]:
        """Analyze document performance and generate recommendations"""
        if not self.client or not self.api_key:
            logger.warning("OpenAI client not available for document analysis")
            return []
        
        try:
            prompt = f"""
Analyze this document performance data and provide actionable recommendations:

**Document Info:**
- Type: {document_data.get('type', 'Unknown')}
- Title: {document_data.get('title', 'Unknown')}
- Sections: {len(document_data.get('sections', []))}

**Performance Metrics:**
- Views: {performance_data.get('views', 0)}
- Average Time Spent: {performance_data.get('avg_time', 0)} seconds
- Completion Rate: {performance_data.get('completion_rate', 0)}%
- Download Rate: {performance_data.get('download_rate', 0)}%
- Sign Rate: {performance_data.get('sign_rate', 0)}%

**Engagement Data:**
{json.dumps(performance_data.get('engagement', {}), indent=2)}

Provide 3-5 specific, actionable recommendations to improve document performance.
Format as JSON array with this structure:
[
  {{
    "type": "content|structure|timing|pricing",
    "title": "Brief recommendation title",
    "description": "Detailed explanation and action steps",
    "confidence_score": 0.85,
    "expected_impact": "Description of expected improvement"
  }}
]
"""
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert document performance analyst. Provide data-driven recommendations in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            
            # Clean and parse JSON response
            content = content.strip()
            if content.startswith('```json'):
                content = content[7:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()
            
            recommendations_data = json.loads(content)
            
            recommendations = []
            for rec_data in recommendations_data:
                recommendation = AIRecommendation(
                    document_id=document_data.get('id', ''),
                    type=rec_data.get('type', 'content'),
                    title=rec_data.get('title', ''),
                    description=rec_data.get('description', ''),
                    confidence_score=rec_data.get('confidence_score', 0.5),
                    expected_impact=rec_data.get('expected_impact', ''),
                    based_on_data=[f"Document performance analysis"]
                )
                recommendations.append(recommendation)
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error analyzing document performance: {e}")
            return []

    async def generate_content_suggestions(self, document_type: str, industry: str, successful_patterns: List[Dict]) -> List[str]:
        """Generate content suggestions based on successful patterns"""
        if not self.client or not self.api_key:
            return []
        
        try:
            prompt = f"""
Based on successful document patterns in the {industry} industry for {document_type} documents, 
generate 5 specific content suggestions.

**Successful Patterns:**
{json.dumps(successful_patterns, indent=2)}

Provide actionable content suggestions that incorporate these successful patterns.
Return as a simple JSON array of strings.
"""
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a content optimization expert. Provide specific, actionable suggestions in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            content = response.choices[0].message.content
            
            # Clean and parse JSON response
            content = content.strip()
            if content.startswith('```json'):
                content = content[7:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()
            
            suggestions = json.loads(content)
            
            return suggestions if isinstance(suggestions, list) else []
            
        except Exception as e:
            logger.error(f"Error generating content suggestions: {e}")
            return []

# Global service instance
openai_service = OpenAIService()