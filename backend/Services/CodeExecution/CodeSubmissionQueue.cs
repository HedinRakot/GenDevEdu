using System.Threading.Channels;

namespace DevEdu.Api.Services.CodeExecution;

public interface ICodeSubmissionQueue
{
    ValueTask EnqueueAsync(string submissionId, CancellationToken ct = default);
    IAsyncEnumerable<string> DequeueAllAsync(CancellationToken ct);
}

/// <summary>
/// Bounded in-memory Channel. Trägt nur die Submission-Id; der volle Zustand lebt
/// in MongoDB, damit der Worker nach einem Neustart neu lesen kann.
/// </summary>
public class CodeSubmissionQueue : ICodeSubmissionQueue
{
    private readonly Channel<string> _channel =
        Channel.CreateBounded<string>(new BoundedChannelOptions(100)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
        });

    public ValueTask EnqueueAsync(string submissionId, CancellationToken ct = default) =>
        _channel.Writer.WriteAsync(submissionId, ct);

    public IAsyncEnumerable<string> DequeueAllAsync(CancellationToken ct) =>
        _channel.Reader.ReadAllAsync(ct);
}
