import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const addUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["admin", "user"]),
  roomId: z.string().nullable(),
});

type AddUserFormValues = z.infer<typeof addUserSchema>;

interface AddUserModalProps {
  onClose: () => void;
}

export default function AddUserModal({ onClose }: AddUserModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get rooms for assignment
  const { data: rooms = [] } = useQuery<any[]>({
    queryKey: ["/api/rooms"],
  });

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      fullName: "",
      username: "",
      password: "",
      role: "user",
      roomId: null,
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/users", userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User has been added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: AddUserFormValues) => {
    try {
      console.log("Submitting form with values:", values);
      const userData = {
        ...values,
        email: "", // Add empty email, as our schema still requires it on the backend
        roomId: values.roomId && values.roomId !== 'none' ? parseInt(values.roomId) : null,
      };
      console.log("Processed user data:", userData);
      addUserMutation.mutate(userData);
    } catch (err: any) {
      console.error("Error in form submission:", err);
      toast({
        title: "Form Error",
        description: `Error preparing form data: ${err.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#2A3042] text-white border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New User</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter full name"
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
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter username"
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter password"
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
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-[#374151] border-gray-600">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#374151] border-gray-600">
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to Room</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-[#374151] border-gray-600">
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#374151] border-gray-600">
                      <SelectItem value="none">No Room</SelectItem>
                      {rooms.map((room: any) => (
                        <SelectItem key={room.id} value={String(room.id)}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                disabled={addUserMutation.isPending}
              >
                {addUserMutation.isPending ? "Adding..." : "Add User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
