import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  capacity: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: "Capacity must be a number",
  }),
  active: z.boolean(),
  encrypted: z.boolean(),
  isolated: z.boolean(),
});

type CreateRoomFormValues = z.infer<typeof createRoomSchema>;

interface CreateRoomModalProps {
  onClose: () => void;
}

export default function CreateRoomModal({ onClose }: CreateRoomModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateRoomFormValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: "",
      capacity: "20",
      active: true,
      encrypted: true,
      isolated: true,
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (roomData: any) => {
      const response = await apiRequest("POST", "/api/rooms", roomData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Room has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create room: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CreateRoomFormValues) => {
    const roomData = {
      ...values,
      capacity: parseInt(values.capacity),
    };
    createRoomMutation.mutate(roomData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#2A3042] text-white border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create New Room</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter room name"
                      {...field}
                      className="bg-[#374151] border-gray-600"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-[#374151] border-gray-600">
                        <SelectValue placeholder="Select capacity" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#374151] border-gray-600">
                      <SelectItem value="10">10 users</SelectItem>
                      <SelectItem value="15">15 users</SelectItem>
                      <SelectItem value="20">20 users</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-gray-400">
                    Maximum number of users allowed in the room
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4 pt-2">
              <FormLabel className="block text-sm font-medium">Security Options</FormLabel>
              
              <FormField
                control={form.control}
                name="encrypted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-[#0EA5E9] data-[state=checked]:border-[#0EA5E9]"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Enable end-to-end encryption
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isolated"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-[#0EA5E9] data-[state=checked]:border-[#0EA5E9]"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Enable audio isolation
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-[#0EA5E9] data-[state=checked]:border-[#0EA5E9]"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Set as active
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#0EA5E9] hover:bg-[#0284C7]"
                disabled={createRoomMutation.isPending}
              >
                {createRoomMutation.isPending ? "Creating..." : "Create Room"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
