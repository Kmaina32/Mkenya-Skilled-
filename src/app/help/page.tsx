
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { HelpCircle, Loader2, Send, UserCircle, Bot, BookText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/Sidebar';
import { studentHelp } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTutorSettings } from '@/lib/firebase-service';
import type { TutorSettings } from '@/lib/firebase-service';

const helpSchema = z.object({
  question: z.string().min(10, 'Please ask a more detailed question.'),
});

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

function FaqComponent() {
    return (
        <Card className="h-full border-0 shadow-none">
            <CardContent className="pt-6">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>How do I purchase a course?</AccordionTrigger>
                        <AccordionContent>
                        To purchase a course, simply navigate to the course you're interested in and click the "View Course" button. On the course detail page, you'll see a purchase button with the price. We use M-Pesa for secure payments. Just follow the on-screen instructions to complete your purchase.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>Can I get a refund?</AccordionTrigger>
                        <AccordionContent>
                        Due to the digital nature of our courses, we do not offer refunds once a course has been purchased. We encourage you to review the course details and curriculum before making a purchase.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>How do I get my certificate?</AccordionTrigger>
                        <AccordionContent>
                        A certificate is awarded after you successfully complete all course lessons and pass the final exam with a score of 80% or higher. Once you meet these requirements, your certificate will be available to download from your dashboard.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                        <AccordionTrigger>I forgot my password. What do I do?</AccordionTrigger>
                        <AccordionContent>
                        If you've forgotten your password, click the "Forgot your password?" link on the login page. You will receive an email with instructions on how to reset your password.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    )
}

function AiAssistant() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [tutorSettings, setTutorSettings] = useState<TutorSettings | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

     useEffect(() => {
        getTutorSettings().then(settings => {
            setTutorSettings(settings);
            setMessages([
                {
                    role: 'assistant',
                    content: settings.prompts?.split('\n')[0] || "Hello! If you can't find your answer in the FAQ, ask me anything about how the platform works."
                }
            ]);
        });
    }, []);

     const form = useForm<z.infer<typeof helpSchema>>({
        resolver: zodResolver(helpSchema),
        defaultValues: {
          question: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof helpSchema>) => {
        setIsLoading(true);
        const userMessage: Message = { role: 'user', content: values.question };
        setMessages(prev => [...prev, userMessage]);
        form.reset();

        try {
            const result = await studentHelp({ question: values.question });
            const ginaMessage: Message = { role: 'assistant', content: result.answer };
            setMessages(prev => [...prev, ginaMessage]);
        } catch (error) {
            console.error("AI help failed:", error);
            toast({ title: 'Error', description: 'The AI assistant is currently unavailable. Please try again later.', variant: 'destructive'});
            setMessages(prev => prev.slice(0, prev.length - 1));
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Card className="h-full flex flex-col border-0 shadow-none">
            <CardContent className="flex-grow overflow-hidden p-0">
                <ScrollArea className="h-full px-6 py-4">
                    <div className="space-y-6">
                        {messages.map((message, index) => (
                            <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                {message.role === 'assistant' && (
                                     <Avatar className="h-8 w-8 border">
                                        <AvatarImage src={tutorSettings?.avatarUrl} />
                                        <AvatarFallback><Bot/></AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`rounded-lg px-4 py-3 max-w-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                                {message.role === 'user' && <UserCircle className="h-8 w-8 text-muted-foreground" />}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8 border">
                                    <AvatarImage src={tutorSettings?.avatarUrl} />
                                    <AvatarFallback><Bot/></AvatarFallback>
                                </Avatar>
                                <div className="rounded-lg px-4 py-3 bg-secondary flex items-center">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardContent className="border-t pt-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
                    <FormField
                    control={form.control}
                    name="question"
                    render={({ field }) => (
                        <FormItem className="flex-grow">
                        <FormControl>
                            <Textarea
                            placeholder="e.g., How do I get my certificate?"
                            className="min-h-0 resize-none"
                            rows={1}
                            {...field}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                form.handleSubmit(onSubmit)();
                                }
                            }}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                    <Button type="submit" disabled={isLoading} size="icon">
                    <Send className="h-4 w-4" />
                    </Button>
                </form>
                </Form>
            </CardContent>
        </Card>
    )
}

export default function HelpPage() {
  return (
    <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
            <Header />
            <div className='flex flex-col min-h-screen'>
                <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col">
                    <div className="text-center mb-8">
                        <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                            <HelpCircle className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold font-headline">Help Center</h1>
                        <p className="text-muted-foreground">Get help from our AI assistant or browse the FAQ.</p>
                    </div>
                    <div className="flex-grow max-w-4xl mx-auto w-full">
                       <Tabs defaultValue="faq" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="faq">
                                <BookText className="mr-2 h-4 w-4" />
                                FAQ
                            </TabsTrigger>
                            <TabsTrigger value="ai-assistant">
                                <Bot className="mr-2 h-4 w-4" />
                                AI Assistant
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="faq">
                              <FaqComponent />
                          </TabsContent>
                          <TabsContent value="ai-assistant" className="h-[60vh] flex flex-col">
                             <AiAssistant />
                          </TabsContent>
                        </Tabs>
                    </div>
                </main>
              <Footer />
            </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
