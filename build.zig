const std = @import("std");

pub fn build(b: *std.Build) void {
    const exe = b.addExecutable(.{
        .name = "sfl-template",
        .root_module = b.createModule(.{
            .root_source_file = b.path("template.main.zig"),
            .target = b.graph.host,
        }),
    });

    b.installArtifact(exe);

    // const exe = b.addExecutable(.{
    //     .name = "sfl-template",
    //     .root_module = b.createModule(.{
    //         .root_source_file = b.path("src/main.zig"),
    //         .optimize = .ReleaseSmall,
    //         .target = b.resolveTargetQuery(.{
    //             .cpu_arch = .wasm32,
    //             .os_tag   = .freestanding,
    //         })
    //     })
    // });
    //
    // exe.rdynamic = true;
    // exe.entry    = .disabled;
    //
    // b.installArtifact(exe);
}
