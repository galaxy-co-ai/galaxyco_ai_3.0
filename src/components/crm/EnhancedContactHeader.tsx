import { 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar, 
  Sparkles, 
  Target, 
  TrendingUp,
  Building2,
  MapPin,
  Linkedin,
  Twitter,
  Globe,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Contact } from "@/types/crm";

interface ContactHeaderProps {
  contact: Contact;
}

export function EnhancedContactHeader({ contact }: ContactHeaderProps) {
  // Calculate relationship health color
  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-amber-500";
    return "text-red-500";
  };

  const getHealthGradient = (score: number) => {
    if (score >= 80) return "bg-gradient-to-r from-emerald-500 to-teal-500";
    if (score >= 60) return "bg-gradient-to-r from-blue-500 to-cyan-500";
    if (score >= 40) return "bg-gradient-to-r from-amber-500 to-orange-500";
    return "bg-gradient-to-r from-red-500 to-rose-500";
  };

  return (
    <div className="p-5 space-y-5">
      {/* Top Profile Section */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-75 blur transition duration-500 group-hover:opacity-100"></div>
          <Avatar className="h-16 w-16 border-2 border-white relative shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white">
              {contact.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-2 border-white ${
            contact.status === 'hot' ? 'bg-red-500' : 
            contact.status === 'warm' ? 'bg-amber-500' : 'bg-blue-500'
          }`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  {contact.name}
                </h1>
                <Badge variant="outline" className="text-[10px] font-medium bg-red-50 text-red-600 border-red-200 px-1.5 py-0">
                  {contact.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {contact.company}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  San Francisco, CA
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full text-muted-foreground hover:text-blue-600 hover:bg-blue-50">
                      <Linkedin className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>LinkedIn</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full text-muted-foreground hover:text-sky-500 hover:bg-sky-50">
                <Twitter className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full text-muted-foreground hover:text-slate-900 hover:bg-slate-100">
                <Globe className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full">
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Relationship Health Bar */}
          <div className="mt-4 max-w-md">
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">Relationship Health</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Sparkles className={`w-3 h-3 ${getHealthColor(contact.aiHealthScore)}`} />
                    </TooltipTrigger>
                    <TooltipContent>AI-calculated score</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className={`text-xs font-bold ${getHealthColor(contact.aiHealthScore)}`}>
                {contact.aiHealthScore}/100
              </span>
            </div>
            <Progress value={contact.aiHealthScore} className="h-1.5" indicatorClassName={getHealthGradient(contact.aiHealthScore)} />
            <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              Trending up: {contact.interactions} interactions in the last 30 days
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Button variant="outline" className="h-auto py-2 flex flex-col gap-0.5 items-center justify-center border-dashed hover:border-blue-500 hover:bg-blue-50/50 group">
          <Mail className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-600" />
          <span className="text-[11px] font-medium text-muted-foreground group-hover:text-blue-700">Email</span>
        </Button>
        <Button variant="outline" className="h-auto py-2 flex flex-col gap-0.5 items-center justify-center border-dashed hover:border-green-500 hover:bg-green-50/50 group">
          <Phone className="w-3.5 h-3.5 text-muted-foreground group-hover:text-green-600" />
          <span className="text-[11px] font-medium text-muted-foreground group-hover:text-green-700">Call</span>
        </Button>
        <Button variant="outline" className="h-auto py-2 flex flex-col gap-0.5 items-center justify-center border-dashed hover:border-purple-500 hover:bg-purple-50/50 group">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground group-hover:text-purple-600" />
          <span className="text-[11px] font-medium text-muted-foreground group-hover:text-purple-700">Meet</span>
        </Button>
        <Button className="h-auto py-2 flex flex-col gap-0.5 items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm hover:shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Ask AI</span>
        </Button>
      </div>

      {/* Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="p-3 bg-blue-50/50 border-blue-100">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600 flex-shrink-0">
              <Target className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-blue-600 mb-0.5 uppercase tracking-wide">Next Best Action</p>
              <p className="text-xs font-semibold text-slate-900 leading-snug">{contact.nextAction}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Suggested by AI based on deal stage</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 bg-purple-50/50 border-purple-100">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600 flex-shrink-0">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-purple-600 mb-0.5 uppercase tracking-wide">Last Interaction Context</p>
              <p className="text-xs font-semibold text-slate-900 leading-snug">"{contact.aiInsight}"</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{contact.lastContact}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
